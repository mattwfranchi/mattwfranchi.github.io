import React, { useEffect, useState, useMemo } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import WhiteboardLayout from './Whiteboard';
import type { WhiteboardProps } from '../types/whiteboard';

const BrainPage: React.FC<WhiteboardProps> = (props) => {
  const [isLoading, setIsLoading] = useState(true);

  // Apply mobile-level optimizations for all devices
  useEffect(() => {
    // Apply aggressive performance optimizations for all devices
    const htmlElement = document.documentElement;
    htmlElement.classList.add('mobile-optimized', 'reduce-motion', 'perf-low');
    
    // Set CSS custom properties for maximum performance
    htmlElement.style.setProperty('--enable-animations', '0');
    htmlElement.style.setProperty('--enable-3d-effects', '0');
    htmlElement.style.setProperty('--max-items', '20'); // Limit items for all devices
    
    // Force simplified background for all devices
    htmlElement.classList.add('simplified-background');
    
    console.log('Mobile-level performance optimizations applied for all devices');
  }, []);

  // Handle component mounting and loading states
  useEffect(() => {
    // Mark that React has hydrated
    document.documentElement.classList.add('react-loaded');
    
    // Fast loading for all devices (mobile-style)
    const loadingTimer = setTimeout(() => {
      // Hide loading indicator instantly (mobile-style)
      const loader = document.getElementById('brain-loading');
      if (loader) {
        loader.style.display = 'none';
      }
      
      setIsLoading(false);
    }, 100); // Very fast loading

    return () => clearTimeout(loadingTimer);
  }, []);

  // Optimize props for mobile-level performance for all devices
  const optimizedProps = useMemo(() => {
    const { albums, snips, playlists } = props;
    
    // Limit items to mobile levels for all devices
    const maxItems = 20;
    
    return {
      ...props,
      albums: albums.slice(0, Math.min(albums.length, Math.floor(maxItems * 0.4))),
      snips: snips.slice(0, Math.min(snips.length, Math.floor(maxItems * 0.3))),
      playlists: playlists.slice(0, Math.min(playlists.length, Math.floor(maxItems * 0.3))),
      useOptimizedRendering: true,
      performanceMode: 'mobile', // Always use mobile mode
    };
  }, [props]);

  // Show simplified loading screen for all devices (mobile-style)
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }
  
  return (
    <Router basename="/brain">
      <Routes>
        <Route path="/" element={
          <WhiteboardLayout {...optimizedProps} />
        } />
      </Routes>
    </Router>
  );
};

export default BrainPage;