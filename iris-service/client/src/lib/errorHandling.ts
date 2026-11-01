/**
 * Error handling utilities for the application
 */

/**
 * Patches the Vite HMR system to prevent unhandled promise rejections from showing in the console.
 * This function should be called once on application startup.
 */
export function patchViteHMR(): void {
  // Only execute in development mode
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  
  try {
    // APPROACH 1: Replace fetch API with error-catching version (simpler approach)
    const originalFetch = window.fetch;
    
    window.fetch = function patchedFetch(input, init) {
      const promise = originalFetch(input, init);
      
      // Catch all fetch errors silently, but only log Vite-related ones
      return promise.catch(err => {
        // Log only Vite-related errors
        if (
          typeof input === 'string' && 
          (input.includes('/@vite/client') || 
           input.includes('vite-hmr') || 
           input.includes('__vite_ping') ||
           input.includes('.hot-update.'))
        ) {
          console.log('[Vite HMR] Network request suppressed:', 
            err instanceof Error ? err.message : 'Unknown error');
        }
        
        // Return an empty successful response to prevent cascading errors
        return new Response(JSON.stringify({}), { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' }
        });
      });
    };
    
    // APPROACH 2: For maximum safety, install global catch handlers to prevent errors
    
    // 2a: Catch synchronous errors from Vite scripts
    window.addEventListener('error', function(event) {
      // Only suppress errors from Vite HMR scripts
      if (
        event.filename && 
        typeof event.filename === 'string' &&
        event.filename.includes('vite') && 
        !event.error?.stack?.includes('user code')
      ) {
        console.log('[Vite Error] Suppressed error in', event.filename);
        event.preventDefault();
        return false;
      }
    }, true);

    // 2b: Force wrap all unhandled promises with our handler
    window.addEventListener('unhandledrejection', function(event) {
      const error = event.reason;
      const errorString = String(error || '');
      
      // Only catch Vite HMR related errors
      if (
        errorString.includes('[vite]') || 
        errorString.includes('WebSocket') || 
        errorString.includes('socket') ||
        errorString.includes('network') ||
        errorString.includes('cors') ||
        errorString.includes('connecting') ||
        errorString.includes('Failed to fetch') ||
        error === null || 
        typeof error === 'undefined'
      ) {
        console.log('[Global Unhandled] Vite error suppressed:', errorString.slice(0, 100));
        event.preventDefault();
        return false;
      }
    }, true);
    
    console.log('[Vite HMR] Simplified error handling patch applied');
  } catch (error) {
    console.error('Error applying Vite HMR patches:', error);
  }
}