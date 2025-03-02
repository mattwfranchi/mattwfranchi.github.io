import React, { useRef, useEffect, useState } from 'react';
import { performanceConfig, trackElement } from '../utils/performanceUtils';

interface AnimationOptions {
  enabled?: boolean;
  priority?: 'high' | 'medium' | 'low';
  visibilityThreshold?: number;
  pauseWhenOffscreen?: boolean;
}

/**
 * A hook that optimizes animations based on the current performance context
 * and visibility of the element.
 */
export function usePerformanceOptimizedAnimation(
  options: AnimationOptions = {}
) {
  const {
    enabled = true,
    priority = 'medium',
    visibilityThreshold = 0.2,
    pauseWhenOffscreen = true
  } = options;
  
  const elementRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(enabled);
  
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    
    // Track element with the performance system
    const cleanup = trackElement(element);
    
    // Also use intersection observer if pauseWhenOffscreen is true
    if (pauseWhenOffscreen) {
      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          const isElementVisible = entry.isIntersecting && 
                                  entry.intersectionRatio >= visibilityThreshold;
          
          setIsVisible(isElementVisible);
          
          // Update animation state based on visibility and performance mode
          const shouldAnimate = isElementVisible && 
            (performanceConfig.currentPerformanceMode !== 'minimal') &&
            (priority === 'high' || performanceConfig.currentPerformanceMode !== 'low');
            
          setIsAnimating(shouldAnimate);
          
          if (shouldAnimate) {
            element.classList.remove('paused-animation');
          } else {
            element.classList.add('paused-animation');
          }
        },
        {
          threshold: [0, visibilityThreshold, 0.5, 1.0],
          rootMargin: '100px'
        }
      );
      
      observer.observe(element);
      
      return () => {
        observer.disconnect();
        cleanup();
      };
    }
    
    return cleanup;
  }, [priority, visibilityThreshold, pauseWhenOffscreen]);
  
  // Update animation state when performance mode changes
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    
    // Determine if animation should be enabled based on performance mode
    const canAnimateInCurrentMode = 
      performanceConfig.currentPerformanceMode === 'high' || 
      (performanceConfig.currentPerformanceMode === 'medium' && priority !== 'low') ||
      (priority === 'high');
    
    const shouldAnimate = enabled && isVisible && canAnimateInCurrentMode;
    
    setIsAnimating(shouldAnimate);
    
    if (shouldAnimate) {
      element.classList.remove('paused-animation');
    } else {
      element.classList.add('paused-animation');
    }
  }, [enabled, isVisible, priority, performanceConfig.currentPerformanceMode]);
  
  return {
    ref: elementRef,
    isVisible,
    isAnimating,
    performanceMode: performanceConfig.currentPerformanceMode
  };
}

export default usePerformanceOptimizedAnimation;
