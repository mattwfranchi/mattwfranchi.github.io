import React from 'react';
import type { Transform } from '../../types/whiteboard';
// import whiteboard.css 
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
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
        transformOrigin: 'center center',
        transition: isTransitioning ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
      }}
    >
      {children}
    </div>
  );
}