import React from 'react';
import { performanceLogger } from './performanceLogger';

// Type definition for navigator.deviceMemory
interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number;
}

// Add this to define the custom window property
interface WindowWithCustomRAF extends Window {
  _originalRequestAnimationFrame?: typeof window.requestAnimationFrame;
}

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
  
  // NEW: Add data attribute for easier CSS targeting
  document.documentElement.dataset.perfMode = mode;
  
  switch (mode) {
    case 'high':
      performanceConfig.animationSettings.maxActiveAnimations = 30; // REDUCED from 50
      break;
    case 'medium':
      performanceConfig.animationSettings.maxActiveAnimations = 15; // REDUCED from 25
      document.documentElement.classList.add('reduce-animations');
      break;
    case 'low':
      performanceConfig.animationSettings.maxActiveAnimations = 5; // REDUCED from 10
      document.documentElement.classList.add('reduce-animations', 'simplify-effects');
      break;
    case 'minimal':
      performanceConfig.animationSettings.maxActiveAnimations = 0;
      document.documentElement.classList.add('reduce-animations', 'simplify-effects', 'disable-animations');
      break;
  }
  
  // NEW: Apply performance settings to window environment
  if (typeof window !== 'undefined') {
    const win = window as WindowWithCustomRAF;
    
    // Adjust browser rendering for performance in low/minimal modes
    if (mode === 'low' || mode === 'minimal') {
      // Reduce animation frame rate to save CPU/GPU
      if (!win._originalRequestAnimationFrame && win.requestAnimationFrame) {
        win._originalRequestAnimationFrame = win.requestAnimationFrame;
        let lastTime = 0;
        
        // Throttle to ~30fps in low mode, ~15fps in minimal
        const targetFPS = mode === 'minimal' ? 15 : 30;
        const frameInterval = 1000 / targetFPS;
        
        win.requestAnimationFrame = function(callback) {
          const currentTime = performance.now();
          const timeUntilNextFrame = Math.max(0, frameInterval - (currentTime - lastTime));
          
          if (timeUntilNextFrame <= 1) {
            lastTime = currentTime;
            return win._originalRequestAnimationFrame!(callback);
          } else {
            // Cast setTimeout's return value to number to match requestAnimationFrame's return type
            return Number(setTimeout(() => {
              lastTime = performance.now();
              callback(lastTime);
            }, timeUntilNextFrame));
          }
        };
      }
    } else if (win._originalRequestAnimationFrame) {
      // Restore original rAF when back to higher performance modes
      win.requestAnimationFrame = win._originalRequestAnimationFrame;
      delete win._originalRequestAnimationFrame;
    }
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
  optimizeImageLoading();
  optimizeWindowBackground(); // Add this line
  
  // Set initial quality based on device memory if available
  if (typeof navigator !== 'undefined') {
    const nav = navigator as NavigatorWithMemory;
    
    // Check for device memory API
    if (nav.deviceMemory !== undefined) {
      const memory = nav.deviceMemory;
      if (memory <= 2) {
        applyPerformanceMode('minimal');
      } else if (memory <= 4) {
        applyPerformanceMode('low');
      } else if (memory <= 8) {
        applyPerformanceMode('medium');
      }
    } else {
      // No device memory API, use alternative detection
      fallbackPerformanceDetection();
    }
  }
  
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

// Add this fallback function that uses other metrics when deviceMemory isn't available
function fallbackPerformanceDetection() {
  // Check CPU cores as a rough proxy for performance capability
  const cores = navigator.hardwareConcurrency || 2;
  
  // Check if the device is mobile
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  // Check for other performance indicators
  const hasReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasLowData = window.matchMedia('(prefers-reduced-data: reduce)').matches;
  
  // Start with high as default
  let suggestedMode: 'high' | 'medium' | 'low' | 'minimal' = 'high';
  
  // Apply heuristics to determine performance mode
  if (cores <= 2 || (isMobile && cores <= 4)) {
    suggestedMode = 'low';
  } else if (cores <= 4 || isMobile) {
    suggestedMode = 'medium';
  }
  
  // Further reduce if user has accessibility preferences set
  if (hasReduced || hasLowData) {
    suggestedMode = suggestedMode === 'high' ? 'medium' : 
                   suggestedMode === 'medium' ? 'low' : 'minimal';
  }
  
  // Apply the detected mode
  applyPerformanceMode(suggestedMode);
  
  perfLog('log', `Applied fallback performance detection: ${suggestedMode}`);
}

// Add a new function to optimize image loads
export function optimizeImageLoading() {
  if (typeof window === 'undefined') return;
  
  // Use Intersection Observer to lazy load images
  const imgObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          if (src) {
            img.src = src;
            delete img.dataset.src;
            imgObserver.unobserve(img);
          }
        }
      });
    },
    { rootMargin: '200px' } // Start loading when within 200px
  );
  
  // Find all images with data-src attribute
  document.querySelectorAll('img[data-src]').forEach(img => {
    imgObserver.observe(img);
  });
  
  return imgObserver;
}

// Add this function to optimize window background rendering
export function optimizeWindowBackground() {
  // Throttle expensive repaints when scrolling/zooming
  let isScrolling = false;
  let scrollTimer: number | null = null;
  
  const handleScroll = () => {
    if (!isScrolling) {
      document.body.classList.add('is-scrolling');
      isScrolling = true;
    }
    
    if (scrollTimer) clearTimeout(scrollTimer);
    
    scrollTimer = window.setTimeout(() => {
      document.body.classList.remove('is-scrolling');
      isScrolling = false;
    }, 150);
  };
  
  // Apply scroll optimization when window is loaded
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('wheel', handleScroll, { passive: true });
  window.addEventListener('touchmove', handleScroll, { passive: true });
  
  // Add CSS rule for scroll optimization
  const style = document.createElement('style');
  style.textContent = `
    .is-scrolling .cozy-room,
    .is-scrolling .window-background::after {
      will-change: transform;
      pointer-events: none;
    }
    
    .is-scrolling.perf-low .cozy-room,
    .is-scrolling.perf-minimal .cozy-room {
      display: none;
    }
    
    .is-scrolling .window-sill {
      transition: none !important;
    }
  `;
  document.head.appendChild(style);
}