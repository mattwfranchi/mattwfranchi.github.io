import { ROOM_DIMENSIONS, WINDOW_DIMENSIONS } from '../constants/whiteboard';

export function initializeWindowDimensions() {
  const root = document.documentElement;
  
  // Set room dimensions
  root.style.setProperty('--room-width', ROOM_DIMENSIONS.WIDTH);
  root.style.setProperty('--room-height', ROOM_DIMENSIONS.HEIGHT);
  root.style.setProperty('--corner-wall-width', `${ROOM_DIMENSIONS.CORNER_WALL_WIDTH}rem`);
  root.style.setProperty('--wall-color', ROOM_DIMENSIONS.WALL_COLOR);
  
  // Set window dimensions
  root.style.setProperty('--window-width', `${WINDOW_DIMENSIONS.WIDTH}px`);
  root.style.setProperty('--window-height', `${WINDOW_DIMENSIONS.HEIGHT}px`);
  root.style.setProperty('--window-inset-x', `${WINDOW_DIMENSIONS.INSET_X}rem`);
  root.style.setProperty('--window-inset-y', `${WINDOW_DIMENSIONS.INSET_Y}rem`);
  root.style.setProperty('--window-frame-border', `${WINDOW_DIMENSIONS.FRAME_BORDER}rem`);
  root.style.setProperty('--window-frame-inner-border', `${WINDOW_DIMENSIONS.FRAME_INNER_BORDER}rem`);
  root.style.setProperty('--window-pane-gap', `${WINDOW_DIMENSIONS.PANE_GAP}rem`);
  root.style.setProperty('--window-cross-pane-width', `${WINDOW_DIMENSIONS.CROSS_PANE_WIDTH}rem`);
}