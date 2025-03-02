import { performanceLogger } from './performanceLogger';

export const performanceConfig = {
  verboseLogging: false,  // Disable by default in production
  performanceMonitoring: true,
  animationSettings: {
    enabled: true,
    maxActiveAnimations: 50,    // Maximum animations running simultaneously
    reduceAfter: 25000,         // Time in ms after which to reduce animations
    disableAfter: 60000,        // Time in ms after which to disable non-essential animations
    visibilityThreshold: 0.2    // How much of element must be visible to animate (0-1)
  },
  renderSettings: {
    useCheapRenderIfFPS: 30,    // Use cheaper rendering if FPS drops below this value
    throttleBackground: true,   // Throttle background animations
  },
  currentPerformanceMode: 'high' as 'high' | 'medium' | 'low' | 'minimal'
};

// Observer for element visibility (don't animate if not visible)
const visibilityObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      const target = entry.target as HTMLElement;
      if (entry.isIntersecting && entry.intersectionRatio > performanceConfig.animationSettings.visibilityThreshold) {
        target.classList.remove('paused-animation');
      } else {
        target.classList.add('paused-animation');
      }
    });
  },
  {
    root: null,
    rootMargin: '0px',
    threshold: [0, 0.2, 0.5, 1.0]
  }
);

// Track active sticky notes for animation optimization
const activeElements = new Set<HTMLElement>();

export function trackElement(element: HTMLElement) {
  activeElements.add(element);
  visibilityObserver.observe(element);
  throttleAnimations();
  
  return () => {
    activeElements.delete(element);
    visibilityObserver.unobserve(element);
  };
}

// Limit number of active animations based on device capability and count
function throttleAnimations() {
  const maxAnimations = performanceConfig.animationSettings.maxActiveAnimations;
  
  // If we have too many animated elements, throttle some
  if (activeElements.size > maxAnimations) {
    // Sort elements by visibility and importance
    const elements = Array.from(activeElements);
    let count = 0;
    
    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const isInViewport = (
        rect.top >= -100 &&
        rect.left >= -100 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + 100 &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth) + 100
      );
      
      if (count < maxAnimations && isInViewport) {
        el.classList.remove('paused-animation');
        count++;
      } else {
        el.classList.add('paused-animation');
      }
    });
  }
}

// Monitor system temperature via performance proxy
function monitorSystemLoad() {
  let consecutiveSlowFrames = 0;
  let lastMode = performanceConfig.currentPerformanceMode;
  let appStartTime = performance.now();
  
  // Function to run on each frame
  function checkPerformance() {
    const now = performance.now();
    const elapsed = now - appStartTime;
    
    // Time-based throttling (reduce animations over time)
    if (elapsed > performanceConfig.animationSettings.reduceAfter && 
        performanceConfig.currentPerformanceMode === 'high') {
      performanceConfig.currentPerformanceMode = 'medium';
      applyPerformanceMode('medium');
    }
    
    if (elapsed > performanceConfig.animationSettings.disableAfter && 
        performanceConfig.currentPerformanceMode !== 'low' && 
        performanceConfig.currentPerformanceMode !== 'minimal') {
      performanceConfig.currentPerformanceMode = 'low';
      applyPerformanceMode('low');
    }
    
    // Check if performance mode changed
    if (lastMode !== performanceConfig.currentPerformanceMode) {
      perfLog('warn', `Performance mode changed to: ${performanceConfig.currentPerformanceMode}`);
      lastMode = performanceConfig.currentPerformanceMode;
    }
    
    // Schedule next check
    requestIdleCallback(checkPerformance, { timeout: 1000 });
  }
  
  // Start monitoring after a short delay
  setTimeout(() => requestIdleCallback(checkPerformance), 1000);
}

// Apply different performance modes
export function applyPerformanceMode(mode: 'high' | 'medium' | 'low' | 'minimal') {
  performanceConfig.currentPerformanceMode = mode;
  
  // Apply CSS classes based on mode
  document.documentElement.classList.remove('perf-high', 'perf-medium', 'perf-low', 'perf-minimal');
  document.documentElement.classList.add(`perf-${mode}`);
  
  switch (mode) {
    case 'high':
      performanceConfig.animationSettings.maxActiveAnimations = 50;
      break;
    case 'medium':
      performanceConfig.animationSettings.maxActiveAnimations = 25;
      document.documentElement.classList.add('reduce-animations');
      break;
    case 'low':
      performanceConfig.animationSettings.maxActiveAnimations = 10;
      document.documentElement.classList.add('reduce-animations', 'simplify-effects');
      break;
    case 'minimal':
      performanceConfig.animationSettings.maxActiveAnimations = 0;
      document.documentElement.classList.add('reduce-animations', 'simplify-effects', 'disable-animations');
      break;
  }
  
  throttleAnimations();
  return mode;
}

// Add a wrapper function for console logging
export function perfLog(level: 'log' | 'warn' | 'error', message: string, data?: any) {
  if (performanceConfig.verboseLogging) {
    if (data) {
      console[level](`[PerformanceMonitor] ${message}`, data);
    } else {
      console[level](`[PerformanceMonitor] ${message}`);
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

// Detect device capabilities and apply initial optimizations
export function detectDeviceCapabilities() {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isLowPowerDevice = isMobile || window.navigator.hardwareConcurrency <= 4;
  const isHighEndDevice = !isMobile && window.navigator.hardwareConcurrency >= 8;
  
  // Set logging based on device capability
  performanceConfig.verboseLogging = 
    !isLowPowerDevice && 
    process.env.NODE_ENV !== 'production';
    
  // Apply performance mode based on detected capabilities
  if (isLowPowerDevice) {
    applyPerformanceMode(window.navigator.hardwareConcurrency <= 2 ? 'minimal' : 'low');
  } else if (!isHighEndDevice) {
    applyPerformanceMode('medium');
  } else {
    applyPerformanceMode('high');
  }
  
  // Start monitoring system load
  monitorSystemLoad();
  
  // Return the detected capabilities
  return {
    isMobile,
    isLowPowerDevice,
    cpuCores: window.navigator.hardwareConcurrency || 2,
    performanceMode: performanceConfig.currentPerformanceMode
  };
}

// Initialize the performance monitoring system
export function initializePerformanceMonitoring() {
  // Initialize timing
  performanceLogger.start();
  
  // Detect capabilities and apply optimizations
  const capabilities = detectDeviceCapabilities();
  
  // Log initial state
  perfLog('log', 'Performance monitoring initialized', capabilities);
  
  // Add CSS to handle animation pausing
  const style = document.createElement('style');
  style.innerHTML = `
    .paused-animation {
      animation-play-state: paused !important;
      transition: none !important;
    }
    .perf-medium .sticky-note {
      animation-duration: calc(var(--flutter-duration, 8s) * 1.5) !important;
    }
    .perf-low .sticky-note {
      animation-duration: calc(var(--flutter-duration, 8s) * 2) !important;
    }
    .simplify-effects .sticky-note {
      transform-style: flat !important;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
    }
    .disable-animations .sticky-note {
      animation: none !important;
      transform: none !important;
    }
  `;
  document.head.appendChild(style);
  
  // Start monitoring frame rate
  performanceLogger.monitorFrameRate();
  
  return capabilities;
}

// React hook to connect components to performance monitoring
export function usePerformanceOptimization(elementRef: React.RefObject<HTMLElement>) {
  React.useEffect(() => {
    if (elementRef.current) {
      const cleanup = trackElement(elementRef.current);
      return cleanup;
    }
  }, [elementRef]);
  
  return performanceConfig.currentPerformanceMode;
}

// This should be imported and called in your main app entrypoint
export function initializeAppPerformance() {
  initializePerformanceMonitoring();
  performanceLogger.getGPUInfo();
  
  // Keep low-frequency check to detect performance issues
  let lastFPS = 60;
  
  setInterval(() => {
    const currentFPS = performanceLogger.currentFPS;
    
    // If FPS drops significantly, take action
    if (currentFPS < 20 && lastFPS >= 20) {
      perfLog('warn', `Low FPS detected: ${currentFPS}, applying performance optimizations`);
      if (performanceConfig.currentPerformanceMode === 'high') {
        applyPerformanceMode('medium');
      } else if (performanceConfig.currentPerformanceMode === 'medium') {
        applyPerformanceMode('low');
      }
    }
    
    lastFPS = currentFPS;
  }, 5000);
}