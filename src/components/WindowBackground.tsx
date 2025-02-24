import React, { useRef } from 'react';
import type { Transform } from '../types/whiteboard';
import '../styles/window.css';
import backgroundImage from '../assets/vista.jpg';
import { WINDOW_DIMENSIONS } from '../constants/whiteboard';

interface WindowBackgroundProps {
  transform: Transform;
  isTransitioning: boolean;
}

export default function WindowBackground({ transform, isTransitioning }: WindowBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <div
      className="window-background"
      style={{
        /* Set CSS variables for dynamic transform values */
        "--translateX": `${transform.x}px`,
        "--translateY": `${transform.y}px`,
        "--scale": transform.scale,
        "--transition": isTransitioning
          ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          : 'none',
      } as React.CSSProperties}
    >
      <div 
        className="window-frame"
        style={{
          borderWidth: `${WINDOW_DIMENSIONS.FRAME_BORDER}rem`,
        }}
      >
        <canvas
          ref={canvasRef}
          className="nature-scene"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="window-overlay">
          <div className="window-panes">
            <div className="pane">
              <div className="pane-glass" />
            </div>
            <div className="pane">
              <div className="pane-glass" />
            </div>
            <div className="pane">
              <div className="pane-glass" />
            </div>
            <div className="pane">
              <div className="pane-glass" />
            </div>
          </div>
          <div className="crosspane-vertical" />
          <div className="crosspane-horizontal" />
        </div>
      </div>
    </div>
  );
}