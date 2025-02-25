export function detectDeviceCapabilities() {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isLowPowerDevice = isMobile || window.navigator.hardwareConcurrency <= 4;
  
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