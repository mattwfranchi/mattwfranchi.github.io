import React, { useRef, useEffect, useMemo, useState } from 'react';
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

export default function WindowBackground({ transform, isTransitioning }: WindowBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [qualityLevel, setQualityLevel] = useState<'high' | 'medium' | 'low'>('high');

  // CSS variables for transform - this allows for consistent transforms with whiteboard
  const cssVariables = useMemo(() => ({
    "--translateX": `${transform.x}px`,
    "--translateY": `${transform.y}px`,
    "--scale": transform.scale,
  } as React.CSSProperties), [transform.x, transform.y, transform.scale]);

  // Adaptive quality based on performance and scale
  useEffect(() => {
    // Reduce quality when zoomed out (smaller details matter less)
    const newQuality = transform.scale < 0.6 ? 'low' : 
                       transform.scale < 0.8 ? 'medium' : 'high';
                       
    // Further reduce quality based on performance config
    if (performanceConfig.currentPerformanceMode === 'low' || 
        performanceConfig.currentPerformanceMode === 'minimal') {
      setQualityLevel('low');
    } else if (performanceConfig.currentPerformanceMode === 'medium' && newQuality === 'high') {
      setQualityLevel('medium');
    } else {
      setQualityLevel(newQuality);
    }
  }, [transform.scale, performanceConfig.currentPerformanceMode]);

  // Use intersection observer to detect visibility - optimize with simpler check
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

  // Performance-optimized styles with minimal recalculations
  const frameStyle = useMemo(() => ({
    borderWidth: `${WINDOW_DIMENSIONS.FRAME_BORDER}rem`,
    willChange: isTransitioning ? 'transform' : 'auto',
  }), [isTransitioning]);

  // Background style with conditional quality
  const backgroundStyle = useMemo(() => {
    const style: React.CSSProperties = { 
      backgroundImage: `url(${backgroundImage})`,
    };
    
    // Apply quality-based styles
    if (qualityLevel === 'low') {
      style.filter = 'brightness(0.9)';
      style.imageRendering = 'optimizeSpeed';
    } else if (qualityLevel === 'medium') {
      style.filter = 'brightness(0.9) contrast(1.05)';
    } else {
      style.filter = 'brightness(0.9) contrast(1.1)';
      style.transform = 'translate3d(0,0,0)'; // GPU acceleration only on high quality
    }
    
    return style;
  }, [qualityLevel]);

  // Simplified pane rendering based on quality
  const renderWindowPanes = useMemo(() => {
    // Simplify panes when low quality is needed
    if (qualityLevel === 'low') {
      return (
        <div className="window-panes simplified">
          <div className="crosspane-vertical" />
          <div className="crosspane-horizontal" />
        </div>
      );
    }
    
    return (
      <div className="window-panes">
        {Array.from({ length: 4 }).map((_, i) => {
          const positionClass = 
            i === 0 ? "top-left" : 
            i === 1 ? "top-right" : 
            i === 2 ? "bottom-left" : "bottom-right";
          
          return (
            <div key={i} className={`pane ${positionClass}`}>
              <div className="pane-glass" />
            </div>
          );
        })}
        <div className="crosspane-vertical" />
        <div className="crosspane-horizontal" />
      </div>
    );
  }, [qualityLevel]);

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

  return (
    <>
      {/* Simplified room background */}
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
          style={frameStyle}
        >
          <div
            ref={canvasRef}
            className="nature-scene"
            style={backgroundStyle}
          />
          <div className="pane-container">
            {renderWindowPanes}
          </div>
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
}