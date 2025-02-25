import React, { useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Move, Maximize2, CornerRightDown } from 'lucide-react';
import '../../styles/photog.css';

interface CardWrapperProps {
  id: string;
  onDragStart: (id: string, event: React.MouseEvent) => void;
  onDragEnd: () => void;
  onResize: (id: string, event: React.MouseEvent) => void;
  onExpand: (id: string) => void;
  onLongPress: (id: string) => void; // New prop for long press
  children: React.ReactNode;
  item: { position: { x: number; y: number; width: number; height: number; z: number } };
}

const CardWrapper: React.FC<CardWrapperProps> = ({
  id,
  onDragStart,
  onDragEnd,
  onResize,
  onExpand,
  onLongPress, // New prop for long press
  children,
  item
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [longPressTimeout, setLongPressTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 0) {
      e.preventDefault();
      e.stopPropagation();
      onDragStart(id, e);

      // Set a timeout for long press
      const timeout = setTimeout(() => {
        onLongPress(id);
      }, 1000); // 1 second for long press
      setLongPressTimeout(timeout);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onDragEnd();

    // Clear the long press timeout
    if (longPressTimeout) {
      clearTimeout(longPressTimeout);
      setLongPressTimeout(null);
    }
  };

  const handleMouseLeave = () => {
    // Clear the long press timeout if the mouse leaves the card
    if (longPressTimeout) {
      clearTimeout(longPressTimeout);
      setLongPressTimeout(null);
    }
  };

  const handleExpandButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onExpand(id);
  };

  const handleResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onResize(id, e);
  };

  const cardStyle: CSSProperties = {
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
      onMouseLeave={handleMouseLeave}
      style={cardStyle}
      className="draggable-area"
    >
      <div className="sticky-note">
        {children}
        
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