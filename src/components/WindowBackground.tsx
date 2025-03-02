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

  // Use intersection observer to detect visibility
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const isInViewport = entry.isIntersecting;
        setIsVisible(isInViewport);
        
        if (isInViewport) {
          // Only log when becoming visible to reduce noise
          performanceLogger.mark('background_visible');
        }
      },
      { threshold: [0, 0.1] }
    );
    
    observer.observe(containerRef.current);
    
    return () => observer.disconnect();
  }, []);

  // Performance-optimized memoized styles
  const frameStyle = useMemo(() => ({
    borderWidth: `${WINDOW_DIMENSIONS.FRAME_BORDER}rem`,
    willChange: isTransitioning ? 'transform' : 'auto',
  }), [isTransitioning]);

  // Background style with conditional quality
  const backgroundStyle = useMemo(() => {
    const style: React.CSSProperties = {
      backgroundImage: `url(${backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
    
    // Only use hardware acceleration when needed
    if (isTransitioning || qualityLevel === 'high') {
      style.transform = 'translate3d(0,0,0)'; // Force GPU acceleration
    }
    
    // Apply quality-based styles
    if (qualityLevel === 'low') {
      style.filter = 'brightness(0.9)';
      style.imageRendering = 'optimizeSpeed';
    } else if (qualityLevel === 'medium') {
      style.filter = 'brightness(0.9) contrast(1.05)';
    } else {
      style.filter = 'brightness(0.9) contrast(1.1)';
    }
    
    return style;
  }, [qualityLevel, isTransitioning]);

  // Optimize pane rendering based on quality
  const renderWindowPanes = useMemo(() => {
    // Simplify panes when low quality is needed
    if (qualityLevel === 'low' && !isTransitioning) {
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
        <div className="crosspane-vertical" />
        <div className="crosspane-horizontal" />
      </div>
    );
  }, [qualityLevel, isTransitioning]);

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
      {qualityLevel !== 'low' && <div className="window-overlay" />}
    </div>
  );
}