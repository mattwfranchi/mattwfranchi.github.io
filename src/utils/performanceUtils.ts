export const performanceConfig = {
  verboseLogging: false,  // Disable by default in production
  performanceMonitoring: true
};

// Add a wrapper function for console logging
export function perfLog(level: 'log' | 'warn' | 'error', message: string, data?: any) {
  if (performanceConfig.verboseLogging) {
    if (data) {
      console[level](message, data);
    } else {
      console[level](message);
    }
  }
}

// Export the debug toggle function so it can be used elsewhere
export function toggleDebugMode() {
  performanceConfig.verboseLogging = !performanceConfig.verboseLogging;
  // This will only show if debugging was just enabled
  console.log(`Debug mode: ${performanceConfig.verboseLogging ? 'enabled' : 'disabled'}`);
  return performanceConfig.verboseLogging;
}

export function detectDeviceCapabilities() {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isLowPowerDevice = isMobile || window.navigator.hardwareConcurrency <= 4;
  
  // Set logging based on device capability
  performanceConfig.verboseLogging = 
    !isLowPowerDevice && 
    process.env.NODE_ENV !== 'production';
    
  // Apply optimization classes based on detected capabilities
  if (isLowPowerDevice) {
    document.documentElement.classList.add('mobile-optimized');
    
    // For extremely limited devices, add an extra class
    if (window.navigator.hardwareConcurrency <= 2 || 
        /iPhone|Android 5|Android 6/i.test(navigator.userAgent)) {
      document.documentElement.classList.add('extreme-optimization');
    }
  }
  
  // Monitor for performance issues and dynamically adjust
  let frameDrops = 0;
  let lastTime = performance.now();
  
  function checkFrameRate() {
    const now = performance.now();
    const elapsed = now - lastTime;
    
    // If frame took longer than 50ms (less than 20fps), count as dropped
    if (elapsed > 50) {
      frameDrops++;
      
      // If we detect multiple dropped frames, apply more aggressive optimizations
      if (frameDrops > 5) {
        document.documentElement.classList.add('mobile-optimized', 'extreme-optimization');
        frameDrops = 0;
      }
    }
    
    lastTime = now;
    requestAnimationFrame(checkFrameRate);
  }
  
  // Start monitoring frame rate
  requestAnimationFrame(checkFrameRate);
}