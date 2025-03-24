// Consolidated performance monitoring

import { performanceLogger } from './performanceLogger';
export { performanceLogger };

// Performance configuration
export const performanceConfig = {
  verboseLogging: false,
  currentPerformanceMode: 'high' as 'high' | 'medium' | 'low' | 'minimal',
  animationSettings: {
    enabled: true,
    maxActiveAnimations: 30,
    visibilityThreshold: 0.2
  }
};

// Device capability detection - simplified
export function detectDeviceCapabilities() {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isLowPowerDevice = isMobile || window.navigator.hardwareConcurrency <= 4;
  
  // Set performance mode based on device
  if (isLowPowerDevice) {
    applyPerformanceMode('low');
  } else {
    applyPerformanceMode('high');
  }
  
  return {
    isMobile,
    cpuCores: window.navigator.hardwareConcurrency || 2,
    performanceMode: performanceConfig.currentPerformanceMode
  };
}

// Apply performance mode
export function applyPerformanceMode(mode: 'high' | 'medium' | 'low' | 'minimal') {
  performanceConfig.currentPerformanceMode = mode;
  document.documentElement.dataset.perfMode = mode;
  document.documentElement.classList.remove('perf-high', 'perf-medium', 'perf-low', 'perf-minimal');
  document.documentElement.classList.add(`perf-${mode}`);
  
  return mode;
}

// Element tracking for animation
export function trackElement(element: HTMLElement) {
  // Simplified implementation
}

// Initialize performance monitoring
export function initializePerformance() {
  performanceLogger.start();
  detectDeviceCapabilities();
  optimizeImageLoading();
}

// Optimize image loading
function optimizeImageLoading() {
  if (typeof window === 'undefined') return;
  
  const imgObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            delete img.dataset.src;
            imgObserver.unobserve(img);
          }
        }
      });
    },
    { rootMargin: '200px' }
  );
  
  document.querySelectorAll('img[data-src]').forEach(img => {
    imgObserver.observe(img);
  });
}