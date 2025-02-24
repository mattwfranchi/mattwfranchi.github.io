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
        /* Set CSS variables for dynamic transform values */
        "--translateX": `${transform.x}px`,
        "--translateY": `${transform.y}px`,
        "--scale": transform.scale,
        "--transition": isTransitioning
          ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          : 'none',
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}