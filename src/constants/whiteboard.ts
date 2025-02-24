export const ROOM_DIMENSIONS = {
  // Room is larger than viewport to show wall edges
  WIDTH: '150vw',
  HEIGHT: '150vh',
  CORNER_WALL_WIDTH: 32, // in rem
  WALL_COLOR: '#233156'
} as const;

export const WINDOW_DIMENSIONS = {
  // Window takes up most of the visible wall space
  WIDTH: 3000,  // in pixels
  HEIGHT: 2000, // in pixels
  INSET_X: 12,  // in rem - distance from room edges
  INSET_Y: 8,   // in rem
  FRAME_BORDER: 5,  // in rem
  FRAME_INNER_BORDER: 4.5, // in rem
  PANE_GAP: 4.5, // in rem
  CROSS_PANE_WIDTH: 5, // in rem
  MAX_SCALE: 3
} as const;


export const SCALES = {
  MIN: 0.2,    // Can zoom out to see whole window
  INITIAL: 0.6, // Initial zoom shows most of window
  MAX: 4       // Can zoom way in to read notes
} as const;

export const STICKY_NOTE = {
  // Much smaller relative to window size
  WIDTH: 280,   // in pixels
  HEIGHT: 320,  // in pixels
  MIN_WIDTH: 120,
  MIN_HEIGHT: 120,
  MAX_WIDTH: 360,
  MAX_HEIGHT: 360
} as const;