import React, { useRef, useEffect, useMemo } from 'react';
import type { Transform } from '../types/whiteboard';
import '../styles/window.css';
import backgroundImage from '../assets/vista.jpg';
import { WINDOW_DIMENSIONS } from '../constants/whiteboard';
import { performanceLogger } from '../utils/performanceLogger';

interface WindowBackgroundProps {
  transform: Transform;
  isTransitioning: boolean;
}

export default function WindowBackground({ transform, isTransitioning }: WindowBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // CSS variables for transform - this allows for consistent transforms with whiteboard
  const cssVariables = useMemo(() => ({
    "--translateX": `${transform.x}px`,
    "--translateY": `${transform.y}px`,
    "--scale": transform.scale,
  } as React.CSSProperties), [transform.x, transform.y, transform.scale]);

  const frameStyle = useMemo(() => ({
    borderWidth: `${WINDOW_DIMENSIONS.FRAME_BORDER}rem`,
  }), []);

  const backgroundStyle = useMemo(() => ({
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    willChange: isTransitioning ? 'transform' : 'auto',
    transform: 'translate3d(0,0,0)', // Force GPU acceleration
  }), [isTransitioning, backgroundImage]);

  // Throttle performance logging to reduce overhead
  useEffect(() => {
    let rafId: number;
    let lastCheck = 0;
    const THROTTLE_MS = 1000; // Only log once per second

    const checkPerformance = () => {
      const now = performance.now();
      if (now - lastCheck >= THROTTLE_MS) {
        performanceLogger.mark('background_render_start');
        lastCheck = now;
      }
    };

    const cleanup = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };

    rafId = requestAnimationFrame(checkPerformance);
    return cleanup;
  }, [transform]);

  // Memoize the window panes to prevent unnecessary rerenders
  const windowPanes = useMemo(() => (
    <div className="window-panes">
      {Array.from({ length: 4 }).map((_, i) => {
        // Assign correct class names for positioning
        let positionClass = "";
        if (i === 0) positionClass = "top-left";
        if (i === 1) positionClass = "top-right";
        if (i === 2) positionClass = "bottom-left";
        if (i === 3) positionClass = "bottom-right";
        
        return (
          <div key={i} className={`pane ${positionClass}`}>
            <div className="pane-glass" />
          </div>
        );
      })}
    </div>
  ), []);

  return (
    <div
      className={`window-background ${isTransitioning ? 'is-transitioning' : ''}`}
      style={cssVariables}
    >
      <div 
        className="window-frame"
        style={frameStyle}
      >
        <div
          ref={canvasRef}
          className="nature-scene"
          style={backgroundStyle}
        />
        <div className="pane-container">
          {windowPanes}
          <div className="crosspane-vertical" />
          <div className="crosspane-horizontal" />
        </div>
        <div className="window-frame-overlay" />
      </div>
      <div className="window-overlay" />
    </div>
  );
}