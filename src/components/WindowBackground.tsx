import React, { useRef, useEffect, useMemo, useState, memo } from 'react';
import type { Transform } from '../types/whiteboard';
import '../styles/window.css';
import backgroundImage from '../assets/vista.jpg';
import { WINDOW_DIMENSIONS } from '../constants/whiteboard';
import { performanceLogger } from '../utils/performanceLogger';
import { performanceConfig } from '../utils/performanceUtils';

interface WindowBackgroundProps {
  transform: Transform;
  isTransitioning: boolean;
}

// Memoize the entire component to prevent unnecessary re-renders
export default memo(function WindowBackground({ transform, isTransitioning }: WindowBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [qualityLevel, setQualityLevel] = useState<'high' | 'medium' | 'low'>('high');

  // CSS variables for transform - this allows for consistent transforms with whiteboard
  const cssVariables = useMemo(() => ({
    "--translateX": `${transform.x}px`,
    "--translateY": `${transform.y}px`,
    "--scale": transform.scale,
  } as React.CSSProperties), [transform.x, transform.y, transform.scale]);

  // Adaptive quality with debounced updates to reduce CPU usage
  useEffect(() => {
    const calculateQuality = () => {
      // Only use performance config for quality, ignore zoom level
      if (performanceConfig.currentPerformanceMode === 'low' || 
          performanceConfig.currentPerformanceMode === 'minimal') {
        setQualityLevel('low');
      } else if (performanceConfig.currentPerformanceMode === 'medium') {
        setQualityLevel('medium');
      } else {
        setQualityLevel('high');
      }
    };

    // Use requestIdleCallback for non-critical quality updates
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => calculateQuality(), { timeout: 500 });
    } else {
      setTimeout(calculateQuality, 100);
    }
  }, [performanceConfig.currentPerformanceMode]);

  // Use intersection observer to detect visibility - more efficient
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsVisible(entry.isIntersecting);
        
        // Only log when becoming visible to reduce noise
        if (entry.isIntersecting) {
          performanceLogger.mark('background_visible');
        }
      },
      { threshold: [0] } // Simplify threshold for better performance
    );
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // When the background isn't visible, render a simplified version
  if (!isVisible && !isTransitioning) {
    return (
      <div 
        ref={containerRef}
        className="window-background simplified" 
        style={cssVariables}
      />
    );
  }

  // Only return the exact elements needed for the current quality level
  return (
    <>
      {/* Simplified room background - conditionally render based on quality */}
      <div 
        className={`cozy-room ${qualityLevel !== 'high' ? 'reduced-quality' : ''}`} 
        style={cssVariables}
      >
        <div className="room-wall wall-left"></div>
        <div className="room-wall wall-back"></div>
        {/* Only render floor in high quality mode */}
        {qualityLevel === 'high' && <div className="room-floor"></div>}
      </div>

      {/* Window itself */}
      <div
        ref={containerRef}
        className={`window-background ${isTransitioning ? 'is-transitioning' : ''} quality-${qualityLevel}`}
        style={cssVariables}
      >
        <div 
          className="window-frame"
          style={{
            borderWidth: `${WINDOW_DIMENSIONS.FRAME_BORDER}rem`,
            willChange: isTransitioning ? 'transform' : 'auto',
          }}
        >
          <div
            ref={canvasRef}
            className="nature-scene"
            style={{ 
              backgroundImage: `url(${backgroundImage})`,
              ...(qualityLevel === 'low' && { 
                filter: 'brightness(0.9)'
              })
            }}
          />
          
          {/* Conditional rendering for panes */}
          {qualityLevel === 'low' ? (
            <div className="window-panes simplified">
              <div className="crosspane-vertical" />
              <div className="crosspane-horizontal" />
            </div>
          ) : (
            <div className="pane-container">
              <div className="window-panes">
                {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((pos, i) => (
                  <div key={i} className={`pane ${pos}`}>
                    <div className="pane-glass" />
                  </div>
                ))}
                <div className="crosspane-vertical" />
                <div className="crosspane-horizontal" />
              </div>
            </div>
          )}
          
          {qualityLevel !== 'low' && <div className="window-frame-overlay" />}
        </div>
        
        {/* Window sill - simplified when in low quality mode */}
        <div className={`window-sill ${qualityLevel === 'low' ? 'simplified' : ''}`}>
          <div className="sill-top"></div>
          <div className="sill-front"></div>
        </div>
        
        {qualityLevel !== 'low' && <div className="window-overlay" />}
      </div>
    </>
  );
});