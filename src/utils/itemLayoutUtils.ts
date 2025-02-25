import type { WhiteboardItem, Position } from '../types/whiteboard';
import { WINDOW_DIMENSIONS, STICKY_NOTE } from '../constants/whiteboard';

export function calculateInitialLayout(
  items: WhiteboardItem[],
  columns: number = Math.ceil(Math.sqrt(items.length))
): WhiteboardItem[] {
  // Use a grid layout with equal spacing between items
  const spacing = 450; // Base distance between items in pixels
  const jitterRange = 50; // Maximum random offset in pixels
  
  // Calculate grid dimensions
  const gridWidth = columns * spacing;
  const gridHeight = Math.ceil(items.length / columns) * spacing;
  
  // Position the items in the center of the window but with coordinates 
  // that match our CSS transform system
  // Since both window-background and transform-container use translate(-50%, -50%)
  // and then translate3d(x, y, 0), the coordinates are relative to the center
  // With this transform setup, (0,0) places the items at the center
  const centerX = 0;
  const centerY = 0;
  
  // Calculate start positions to center the grid
  const startX = centerX - (gridWidth / 2) + (spacing / 2);
  const startY = centerY - (gridHeight / 2) + (spacing / 2);

  return items.map((item, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;

    // Add random jitter to position
    const jitterX = (Math.random() - 0.5) * jitterRange;
    const jitterY = (Math.random() - 0.5) * jitterRange;

    // Get default dimensions based on item type
    const defaultWidth = STICKY_NOTE.WIDTH;
    const defaultHeight = STICKY_NOTE.HEIGHT;

    // Add slight random rotation
    const rotation = (Math.random() - 0.5) * 5; // -2.5 to 2.5 degrees

    return {
      ...item,
      position: {
        x: startX + col * spacing + jitterX,
        y: startY + row * spacing + jitterY,
        z: index,
        width: item.position?.width ?? defaultWidth,
        height: item.position?.height ?? defaultHeight,
        expanded: false,
        rotation // Add rotation to position object
      }
    };
  });
}

export function updateItemZIndex(
  items: WhiteboardItem[],
  itemId: string
): WhiteboardItem[] {
  const maxZ = Math.max(...items.map(item => item.position.z));
  
  return items.map(item => ({
    ...item,
    position: {
      ...item.position,
      z: item.id === itemId ? maxZ + 1 : item.position.z
    }
  }));
}