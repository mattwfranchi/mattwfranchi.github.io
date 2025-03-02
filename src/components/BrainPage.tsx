import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import WhiteboardLayout from './Whiteboard';
import type { WhiteboardProps } from '../types/whiteboard';

// Import performance utilities if they exist, otherwise use empty functions
let initializeAppPerformance: (() => void) | undefined;
let performanceLogger: { mark?: (name: string) => void } = {};

try {
  const perfUtils = require('../utils/performanceUtils');
  const loggerUtils = require('../utils/performanceLogger');
  initializeAppPerformance = perfUtils.initializeAppPerformance;
  performanceLogger = loggerUtils.performanceLogger;
} catch (e) {
  console.log('Performance monitoring not available');
}

const BrainPage: React.FC<WhiteboardProps> = (props) => {
  // Initialize performance monitoring when component mounts
  useEffect(() => {
    // Mark component mount in performance timeline
    performanceLogger.mark?.('brain_page_mounted');
    
    // Initialize performance monitoring
    if (initializeAppPerformance) {
      initializeAppPerformance();
    }
    
    // Mark that React has hydrated
    document.documentElement.classList.add('react-loaded');
    
    // Hide loading indicator
    const loader = document.getElementById('brain-loading');
    if (loader) {
      loader.style.opacity = '0';
      loader.style.pointerEvents = 'none';
    }
  }, []);
  
  return (
    <Router basename="/brain">
      <Routes>
        <Route path="/" element={
          <WhiteboardLayout 
            {...props} 
            // Add performance flags if needed by your Whiteboard component
            useOptimizedRendering={true}
          />
        } />
        {/* Add other routes here if needed */}
      </Routes>
    </Router>
  );
};

export default BrainPage;