import { useState, useCallback, useRef, useEffect } from 'react';
import type { Transform } from '../types/whiteboard';
import { WINDOW_DIMENSIONS, SCALES, ROOM_DIMENSIONS } from '../constants/whiteboard';
import { clampScale, clampOffset } from '../utils/whiteboardUtils';
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';
import { throttle } from '../utils/initializeWindowDimensions';

// In our coordinate system, (0,0) is the center of the container
function computeInitialTransform(): Transform {
  return { x: 0, y: 0, scale: SCALES.INITIAL };
}

export function useWhiteboardView() {
  const [transform, setTransform] = useState<Transform>(computeInitialTransform());
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Check if we're on mobile for throttling
  const isMobile = 
    typeof window !== 'undefined' && 
    (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
    window.innerWidth <= 768);

  const updateTransform = useCallback(
    (transformUpdate: Transform | ((prev: Transform) => Transform), animate = false) => {
      if (animate) {
        setIsTransitioning(true);
        if (transitionTimeoutRef.current) {
          clearTimeout(transitionTimeoutRef.current);
        }
        transitionTimeoutRef.current = setTimeout(() => {
          setIsTransitioning(false);
        }, 300);
      }
      
      setTransform(prevTransform => {
        const newTransform = typeof transformUpdate === 'function'
          ? (transformUpdate as (prev: Transform) => Transform)(prevTransform)
          : transformUpdate;
          
        // Add bounds checking for pan limits
        const scaleFactor = newTransform.scale;
        const windowWidth = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--window-width'));
        const windowHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--window-height'));
        
        // Allow panning within a certain boundary around the window
        const maxPanX = windowWidth * 0.75;
        const maxPanY = windowHeight * 0.75;
        
        return {
          x: Math.max(-maxPanX, Math.min(maxPanX, newTransform.x)),
          y: Math.max(-maxPanY, Math.min(maxPanY, newTransform.y)),
          scale: clampScale(newTransform.scale, SCALES.MIN, SCALES.MAX)
        };
      });
    },
    []
  );

  // Mobile-optimized version
  const throttledUpdateTransform = useCallback(
    throttle((update: Transform | ((prev: Transform) => Transform), animate = false) => {
      updateTransform(update, animate);
    }, 16), // ~60fps
    [updateTransform]
  );

  // Use the appropriate update function based on device
  const effectiveUpdateTransform = isMobile ? throttledUpdateTransform : updateTransform;

  const handleZoom = useCallback((newScale: number, focalX: number, focalY: number, animate = false) => {
    // Get the container center
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;
    
    // Calculate focal point offset from center
    const offsetX = focalX - centerX;
    const offsetY = focalY - centerY;
    
    // Scale factor determines how much to adjust pan
    const scaleFactor = newScale / transform.scale;
    
    // Adjust position to keep focal point steady during zoom
    const newX = transform.x - offsetX * (1 - 1/scaleFactor) / transform.scale;
    const newY = transform.y - offsetY * (1 - 1/scaleFactor) / transform.scale;
    
    effectiveUpdateTransform({ x: newX, y: newY, scale: newScale }, animate);
  }, [transform, effectiveUpdateTransform]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY;
      const zoomFactor = 0.005;
      const direction = delta > 0 ? 1 : -1;
      const newScale = clampScale(
        transform.scale * (1 + direction * zoomFactor * Math.abs(delta) / 10),
        SCALES.MIN,
        SCALES.MAX
      );
      
      // Zoom toward the mouse position
      handleZoom(newScale, e.clientX, e.clientY, false);
    } else {
      // Pan with mouse wheel (without Ctrl key)
      const panSpeed = 2.5 / transform.scale; // Adjust pan speed based on zoom level
      const newX = transform.x - e.deltaX * panSpeed;
      const newY = transform.y - e.deltaY * panSpeed;
      
      effectiveUpdateTransform(prev => ({
        ...prev,
        x: newX,
        y: newY
      }));
    }
  }, [transform, handleZoom, effectiveUpdateTransform]);

  const handleZoomIn = useCallback((animate = false) => {
    const newScale = clampScale(transform.scale * 1.2, SCALES.MIN, SCALES.MAX);
    // Zoom toward the center of the viewport
    handleZoom(newScale, window.innerWidth / 2, window.innerHeight / 2, animate);
  }, [transform.scale, handleZoom]);

  const handleZoomOut = useCallback((animate = false) => {
    const newScale = clampScale(transform.scale / 1.2, SCALES.MIN, SCALES.MAX);
    // Zoom out from the center of the viewport
    handleZoom(newScale, window.innerWidth / 2, window.innerHeight / 2, animate);
  }, [transform.scale, handleZoom]);

  const centerView = useCallback((animate = true) => {
    // Reset to the initial transform
    effectiveUpdateTransform(computeInitialTransform(), animate);
  }, [effectiveUpdateTransform]);

  useIsomorphicLayoutEffect(() => {
    // Center the view on initial load
    centerView(false);
    
    // Handle window resize to maintain centered view
    const handleResize = () => {
      effectiveUpdateTransform(prev => ({
        ...prev,
        x: 0,
        y: 0
      }), false);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [centerView, effectiveUpdateTransform]);

  return {
    transform,
    isTransitioning,
    updateTransform: effectiveUpdateTransform,
    handleWheel,
    handleZoomIn,
    handleZoomOut,
    centerView
  };
}