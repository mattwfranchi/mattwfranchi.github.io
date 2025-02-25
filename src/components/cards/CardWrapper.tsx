import React, { useRef } from 'react';
import type { CSSProperties } from 'react';
import { Move, Maximize2, CornerRightDown } from 'lucide-react';
import '../../styles/photog.css';

interface CardWrapperProps {
  id: string;
  onDragStart: (id: string, event: React.MouseEvent) => void;
  onDragEnd: () => void;
  // onResize is now the realtime drag-to-resize handler.
  onResize: (id: string, event: React.MouseEvent) => void;
  // onExpand is the click-to-toggle handler.
  onExpand: (id: string) => void;
  children: React.ReactNode;
  item: { position: { x: number; y: number; width: number; height: number; z: number } };
}

const CardWrapper: React.FC<CardWrapperProps> = ({
  id,
  onDragStart,
  onDragEnd,
  onResize,
  onExpand,
  children,
  item
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 0) {
      e.preventDefault();
      // Let the child buttons/handles stop propagation
      e.stopPropagation();
      onDragStart(id, e);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onDragEnd();
  };

  // Click-to-toggle expansion (instant resize)
  const handleExpandButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    console.log(`Expand button clicked for card ${id}`);
    onExpand(id);
  };

  // Realtime drag-to-resize gesture
  const handleResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    console.log(`Resize handle drag started for card ${id}`);
    onResize(id, e);
  };

  const cardStyle: CSSProperties = {
    // Use CSS variables for positioning instead of direct top/left
    '--item-x': `${item.position.x}px`,
    '--item-y': `${item.position.y}px`,
    '--item-z': item.position.z,
    '--item-width': `${item.position.width}px`,
    '--item-height': `${item.position.height}px`,
    '--item-rotation': `${item.position.rotation || 0}deg`,
    touchAction: 'none',
    cursor: 'grab',
  } as CSSProperties;

  return (
    <div
      ref={cardRef}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      style={cardStyle}
      className="draggable-area"
    >
      <div className="sticky-note">
        {children}
        
        {/* Expand Button */}
        <div className="absolute top-2 right-2 flex items-center space-x-2 z-10">
          <button
            onClick={handleExpandButtonClick}
            className="w-6 h-6 rounded-sm bg-gray-900/80 border border-cyan-500/30 
                       hover:bg-cyan-900/30 transition-all duration-200 flex items-center 
                       justify-center group"
            title="Toggle Expand"
          >
            <Maximize2 
              size={14} 
              className="text-cyan-500/70 group-hover:text-cyan-400 
                         transform group-hover:scale-110 transition-all duration-200" 
            />
          </button>
        </div>

        {/* Resize Handle */}
        <div
          className="absolute bottom-2 right-2 w-6 h-6 cursor-se-resize z-10 
                     flex items-center justify-center group"
          onMouseDown={handleResizeMouseDown}
        >
          <div className="w-4 h-4 rounded-sm bg-gray-900/80 border border-cyan-500/30 
                         group-hover:bg-cyan-900/30 transition-all duration-200 
                         flex items-center justify-center">
            <CornerRightDown 
              size={12} 
              className="text-cyan-500/70 group-hover:text-cyan-400 
                         transform group-hover:scale-110 transition-all duration-200" 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardWrapper;