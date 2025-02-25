import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import WhiteboardLayout from './Whiteboard';
import type { WhiteboardProps } from '../types/whiteboard';

const BrainPage: React.FC<WhiteboardProps> = (props) => {
  return (
    <Router basename="/brain">
      <Routes>
        <Route path="/" element={<WhiteboardLayout {...props} />} />
        {/* Add other routes here if needed */}
      </Routes>
    </Router>
  );
};

export default BrainPage;