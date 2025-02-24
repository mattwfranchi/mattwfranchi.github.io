import type { Point } from '../types/whiteboard';
import { WINDOW_DIMENSIONS, SCALES } from '../constants/whiteboard';

export function clampScale(
  scale: number,
  minScale: number,
  maxScale: number = SCALES.MAX
): number {
  return Math.min(Math.max(scale, minScale), maxScale);
}

export function calculateMinimumScale(viewportWidth: number, viewportHeight: number): number {
  const scaleX = viewportWidth / WINDOW_DIMENSIONS.WIDTH;
  const scaleY = viewportHeight / WINDOW_DIMENSIONS.HEIGHT;
  return Math.max(scaleX, scaleY);
}

export function calculateBoundaries(
  scale: number,
  viewportWidth: number,
  viewportHeight: number
): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  const scaledWidth = WINDOW_DIMENSIONS.WIDTH * scale;
  const scaledHeight = WINDOW_DIMENSIONS.HEIGHT * scale;
  const maxOffsetX = Math.max(0, (scaledWidth - viewportWidth) / 2);
  const maxOffsetY = Math.max(0, (scaledHeight - viewportHeight) / 2);
  
  return {
    minX: -maxOffsetX,
    maxX: maxOffsetX,
    minY: -maxOffsetY,
    maxY: maxOffsetY
  };
}

export function clampOffset(
  offset: Point,
  scale: number,
  viewportWidth: number,
  viewportHeight: number
): Point {
  // Either remove the clamp entirely:
  return offset;

  // Or if you want bounding, replace references to WINDOW_DIMENSIONS
  // with the same ROOM_DIMENSIONS used in your useWhiteboardView.
}