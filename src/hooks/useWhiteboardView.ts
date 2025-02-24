import { useState, useCallback, useRef, useEffect } from 'react';
import type { Transform } from '../types/whiteboard';
import { WINDOW_DIMENSIONS, SCALES, ROOM_DIMENSIONS } from '../constants/whiteboard';
import { clampScale, clampOffset } from '../utils/whiteboardUtils';
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';

// In our coordinate system, the origin (0,0) is the center of the container,
// which matches the extra translation applied in whiteboard.css.
function computeInitialTransform(): Transform {
  return { x: 0, y: 0, scale: SCALES.INITIAL };
}

export function useWhiteboardView() {
  const [transform, setTransform] = useState<Transform>(computeInitialTransform());
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimeoutRef = useRef<NodeJS.Timeout>();

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
      setTransform(prevTransform =>
        typeof transformUpdate === 'function'
          ? (transformUpdate as (prev: Transform) => Transform)(prevTransform)
          : transformUpdate
      );
    },
    []
  );

  // When zooming/panning in our coordinate space, we use the container's center.
  // The container itself is centered via CSS, so its bounding rect center represents the center of our view.
  const getContainerCenter = () => {
    const container = document.querySelector('.whiteboard-container') as HTMLElement;
    if (!container) {
      return { centerX: window.innerWidth / 2, centerY: window.innerHeight / 2 };
    }
    const rect = container.getBoundingClientRect();
    return { centerX: rect.width / 2, centerY: rect.height / 2 };
  };

  const handleZoom = useCallback((newScale: number, focalX: number, focalY: number, animate = false) => {
    // In our coordinate system, transform.x and transform.y represent the extra translation
    // (with 0,0 as the centered origin). When zooming, we want the focal point (given in container coordinates)
    // to remain in the same world location. We compute the new extra translation accordingly.
    const { centerX, centerY } = getContainerCenter();
    // Compute focal offset relative to container center.
    const offsetX = focalX - centerX;
    const offsetY = focalY - centerY;
    // Compute scale factor and update translation so that:
    // newOffset = offset * (newScale / currentScale)
    const scaleFactor = newScale / transform.scale;
    const newX = transform.x - offsetX * (scaleFactor - 1);
    const newY = transform.y - offsetY * (scaleFactor - 1);
    updateTransform({ x: newX, y: newY, scale: newScale }, animate);
  }, [transform, updateTransform]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = -e.deltaY;
      const zoomFactor = 0.005;
      const newScale = clampScale(
        transform.scale * (1 + (delta > 0 ? zoomFactor : -zoomFactor)),
        SCALES.MIN,
        SCALES.MAX
      );
      // Use the event's client coordinates as the focal point;
      // They are in the container's coordinate space given our centered container.
      handleZoom(newScale, e.clientX, e.clientY, false);
    } else {
      // For panning: adjust transform.x/y relative to the scale.
      const newOffset = clampOffset({
        x: transform.x - e.deltaX / transform.scale,
        y: transform.y - e.deltaY / transform.scale
      }, transform.scale, window.innerWidth, window.innerHeight);
      updateTransform({ ...transform, ...newOffset });
    }
  }, [transform, handleZoom, updateTransform]);

  const handleZoomIn = useCallback((animate = false) => {
    const newScale = clampScale(transform.scale * 1.2, SCALES.MIN, SCALES.MAX);
    // Zoom into the container center.
    const { centerX, centerY } = getContainerCenter();
    handleZoom(newScale, centerX, centerY, animate);
  }, [transform.scale, handleZoom]);

  const handleZoomOut = useCallback((animate = false) => {
    const newScale = clampScale(transform.scale / 1.2, SCALES.MIN, SCALES.MAX);
    const { centerX, centerY } = getContainerCenter();
    handleZoom(newScale, centerX, centerY, animate);
  }, [transform.scale, handleZoom]);

  const centerView = useCallback((animate = false) => {
    // Reset extra translation to center (0,0) with the initial scale.
    updateTransform({ x: 0, y: 0, scale: SCALES.INITIAL }, animate);
  }, [updateTransform]);

  useIsomorphicLayoutEffect(() => {
    centerView(false);
    // Optionally update on window resize
    const handleResize = () => centerView(false);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [centerView]);

  return {
    transform,
    isTransitioning,
    updateTransform,
    handleWheel,
    handleZoomIn,
    handleZoomOut,
    centerView
  };
}