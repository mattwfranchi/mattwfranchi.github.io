import { ROOM_DIMENSIONS, WINDOW_DIMENSIONS } from '../constants/whiteboard';

/**
 * Initializes window dimensions and detects mobile devices to apply optimizations
 */
export function initializeWindowDimensions() {
  const root = document.documentElement;
  
  // Detect if we're on a mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                   (window.innerWidth <= 768);
  
  // Apply mobile optimizations if needed
  if (isMobile) {
    console.log('Mobile device detected, applying optimizations');
    
    // Add a class to enable mobile-specific CSS
    root.classList.add('mobile-optimized');
  }
  
  // Set room dimensions
  root.style.setProperty('--room-width', ROOM_DIMENSIONS.WIDTH);
  root.style.setProperty('--room-height', ROOM_DIMENSIONS.HEIGHT);
  root.style.setProperty('--corner-wall-width', `${ROOM_DIMENSIONS.CORNER_WALL_WIDTH}rem`);
  root.style.setProperty('--wall-color', ROOM_DIMENSIONS.WALL_COLOR);
  
  // Set window dimensions - keep original sizes
  root.style.setProperty('--window-width', `${WINDOW_DIMENSIONS.WIDTH}px`);
  root.style.setProperty('--window-height', `${WINDOW_DIMENSIONS.HEIGHT}px`);
  root.style.setProperty('--window-inset-x', `${WINDOW_DIMENSIONS.INSET_X}rem`);
  root.style.setProperty('--window-inset-y', `${WINDOW_DIMENSIONS.INSET_Y}rem`);
  root.style.setProperty('--window-frame-border', `${WINDOW_DIMENSIONS.FRAME_BORDER}rem`);
  root.style.setProperty('--window-frame-inner-border', `${WINDOW_DIMENSIONS.FRAME_INNER_BORDER}rem`);
  root.style.setProperty('--window-pane-gap', `${WINDOW_DIMENSIONS.PANE_GAP}rem`);
  root.style.setProperty('--window-cross-pane-width', `${WINDOW_DIMENSIONS.CROSS_PANE_WIDTH}rem`);
}

/**
 * Utility function to throttle frequent events like pan/zoom on mobile
 */
export function throttle(func: Function, delay: number) {
  let lastCall = 0;
  return function(...args: any[]) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return func(...args);
    }
  };
}