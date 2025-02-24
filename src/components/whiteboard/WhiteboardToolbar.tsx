import React from 'react';
import { Filter, ZoomIn, ZoomOut, Home, ArrowLeft, ArrowRight } from 'lucide-react';

interface WhiteboardToolbarProps {
  onFilter: () => void;
  onZoomIn: (animate?: boolean) => void;
  onZoomOut: (animate?: boolean) => void;
  onCenter: () => void;
  scale: number;
  minScale: number;
  onFocusPrev: () => void;
  onFocusNext: () => void;
}

export const WhiteboardToolbar: React.FC<WhiteboardToolbarProps> = ({
  onFilter,
  onZoomIn,
  onZoomOut,
  onCenter,
  scale,
  minScale,
  onFocusPrev,
  onFocusNext
}) => {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-black/95 dark:bg-black/95 rounded-full px-6 py-3 backdrop-blur-md shadow-lg flex items-center gap-6">
      <button 
        onClick={() => onZoomOut(true)}
        className="p-3 text-cyan-400 hover:text-cyan-300 transition-colors disabled:opacity-50 disabled:hover:text-cyan-400 flex items-center justify-center"
        disabled={scale <= minScale}
        title="Zoom Out"
      >
        <ZoomOut className="w-6 h-6" />
      </button>
      <span className="text-base font-mono w-20 text-center text-cyan-400 font-bold">
        {Math.round(scale * 100)}%
      </span>
      <button 
        onClick={() => onZoomIn(true)} // Pass animate=true
        className="p-3 text-cyan-400 hover:text-cyan-300 transition-colors disabled:opacity-50 disabled:hover:text-cyan-400 flex items-center justify-center"
        disabled={scale >= 1.5}
        title="Zoom In"
      >
        <ZoomIn className="w-6 h-6" strokeWidth={1.5} />
      </button>
      <button 
        onClick={onCenter} 
        className="p-3 text-cyan-400 hover:text-cyan-300 transition-colors flex items-center justify-center"
        title="Center View"
      >
        <Home className="w-6 h-6" strokeWidth={1.5} />
      </button>
      {/* New buttons for focusing on cards */}
      <button 
        onClick={onFocusPrev}
        className="p-3 text-cyan-400 hover:text-cyan-300 transition-colors flex items-center justify-center"
        title="Focus Previous Card"
      >
        <ArrowLeft className="w-6 h-6" strokeWidth={1.5} />
      </button>
      <button 
        onClick={onFocusNext}
        className="p-3 text-cyan-400 hover:text-cyan-300 transition-colors flex items-center justify-center"
        title="Focus Next Card"
      >
        <ArrowRight className="w-6 h-6" strokeWidth={1.5} />
      </button>
      <button 
        onClick={onFilter}
        className="p-3 text-cyan-400 hover:text-cyan-300 transition-colors flex items-center justify-center"
        title="Filter Albums"
      >
        <Filter className="w-6 h-6" strokeWidth={1.5} />
      </button>
    </div>
  );
};