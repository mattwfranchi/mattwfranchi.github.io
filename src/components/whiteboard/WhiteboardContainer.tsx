import React from 'react';
import type { Transform } from '../../types/whiteboard';
import '../../styles/whiteboard.css';

interface WhiteboardContainerProps {
  transform: Transform;
  isTransitioning: boolean;
  width: number;
  height: number;
  children: React.ReactNode;
}

export function WhiteboardContainer({
  transform,
  isTransitioning,
  width,
  height,
  children
}: WhiteboardContainerProps) {
  return (
    <div
      className="whiteboard-container"
      style={{
        width,
        height,
        // Use transform3d for hardware acceleration
        transform: `translate(-50%, -50%) translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
        willChange: isTransitioning ? 'transform' : 'auto',
        // Add passive pointer events for better performance
        touchAction: 'none',
        // Optimize paint areas
        backfaceVisibility: 'hidden',
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}