import { useState, useCallback } from 'react';
import type { Transform } from '../types/whiteboard';

interface Point {
  x: number;
  y: number;
}

export function useWhiteboardGestures(
  onTransformUpdate: (update: Transform | ((prev: Transform) => Transform)) => void
) {
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState<Point>({ x: 0, y: 0 });

  const handleGestureStart = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      if ('button' in e && e.button !== 0) return;
      
      const currentPos = 'touches' in e
        ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
        : { x: e.clientX, y: e.clientY };

      setIsDragging(true);
      setLastMousePos(currentPos);
    },
    []
  );

  const handleGestureMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      e.preventDefault();
      
      const currentPos = 'touches' in e
        ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
        : { x: e.clientX, y: e.clientY };

      // Calculate delta
      const deltaX = currentPos.x - lastMousePos.x;
      const deltaY = currentPos.y - lastMousePos.y;

      // Since the whiteboard container is scaled (via CSS: scale(var(--scale))),
      // divide by the current scale to update the transform in "world" coordinates.
      onTransformUpdate(prevTransform => ({
        ...prevTransform,
        x: prevTransform.x + deltaX / prevTransform.scale,
        y: prevTransform.y + deltaY / prevTransform.scale
      }));

      setLastMousePos(currentPos);
    },
    [isDragging, lastMousePos, onTransformUpdate]
  );

  const handleGestureEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  return {
    handleGestureStart,
    handleGestureMove,
    handleGestureEnd,
    isDragging
  };
}