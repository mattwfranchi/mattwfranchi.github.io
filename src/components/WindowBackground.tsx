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

  // Update transform calculation to match whiteboard
  const transformStyle = useMemo(() => ({
    transform: `translate(-50%, -50%) translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
    transition: isTransitioning ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
    willChange: isTransitioning ? 'transform' : 'auto',
  }), [transform.scale, transform.x, transform.y, isTransitioning]);

  const frameStyle = useMemo(() => ({
    borderWidth: `${WINDOW_DIMENSIONS.FRAME_BORDER}rem`,
  }), []);

  const backgroundStyle = useMemo(() => ({
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    willChange: isTransitioning ? 'transform' : 'auto',
    transform: 'translate3d(0,0,0)', // Force GPU acceleration
  }), [isTransitioning]);

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
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="pane">
          <div className="pane-glass" />
        </div>
      ))}
    </div>
  ), []);

  return (
    <div
      className="window-background"
      style={transformStyle}
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
        <div className="window-overlay">
          {windowPanes}
          <div className="crosspane-vertical" />
          <div className="crosspane-horizontal" />
        </div>
      </div>
    </div>
  );
}