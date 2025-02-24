import React, { useState, useEffect, useCallback } from 'react';
import type { WhiteboardProps, WhiteboardItem, PhotoData } from '../types/whiteboard';
import { WhiteboardContainer } from './whiteboard/WhiteboardContainer';
import { WhiteboardContent } from './whiteboard/WhiteboardContent';
import { WhiteboardToolbar } from './whiteboard/WhiteboardToolbar';
import { WhiteboardGrid } from './whiteboard/WhiteboardGrid';
import { useWhiteboardItems } from '../hooks/useWhiteboardItems';
import { useWhiteboardView } from '../hooks/useWhiteboardView';
import { useWhiteboardGestures } from '../hooks/useWhiteboardGestures';
import { useWhiteboardFilter } from '../hooks/useWhiteboardFilter';
import { useCardFocus } from '../hooks/useCardFocus';
import backgroundImage from '../assets/vista.jpg';
import { WINDOW_DIMENSIONS, STICKY_NOTE, SCALES } from '../constants/whiteboard';
import WindowBackground from './WindowBackground';
import { calculateInitialLayout } from '../utils/itemLayoutUtils';

export default function WhiteboardLayout({
  albums,
  photosByAlbum, // This should be properly typed from the parent
  playlists,
  snips,
  backgroundImage,
}: WhiteboardProps) {
  const {
    items,
    setItems,
    dragging,
    resizing,
    handleDragStart,
    handleDragEnd,
    handleResizeStart, // realtime drag-to-resize handler
    handleExpand,      // click-to-toggle expand handler
  } = useWhiteboardItems();

  const {
    transform,
    isTransitioning,
    updateTransform,
    handleWheel,
    handleZoomIn,
    handleZoomOut,
    centerView,
  } = useWhiteboardView();

  const {
    handleGestureStart,
    handleGestureMove,
    handleGestureEnd,
    isDragging: isPanning,
  } = useWhiteboardGestures(updateTransform);

  const { filter, toggleFilter, filterItems } = useWhiteboardFilter();
  const [showGrid, setShowGrid] = useState(true);

  // Initialize items on mount with unique IDs
  const initializeItems = useCallback(() => {
    const initialItems: WhiteboardItem[] = [
      ...albums.map(album => ({
        id: `album-${album.slug}`,
        type: 'album' as const,
        data: album,
        position: { 
          x: 0, 
          y: 0, 
          z: 0, 
          width: STICKY_NOTE.WIDTH, 
          height: STICKY_NOTE.HEIGHT, 
          expanded: false 
        },
      })),
      ...snips.map(snip => ({
        id: `snip-${snip.slug}`,
        type: 'snip' as const,
        data: snip,
        position: { 
          x: 0, 
          y: 0, 
          z: 0, 
          width: STICKY_NOTE.WIDTH, 
          height: STICKY_NOTE.HEIGHT, 
          expanded: false 
        },
      })),
      ...playlists.map(playlist => ({
        id: `playlist-${playlist.slug}`,
        type: 'playlist' as const,
        data: playlist,
        position: { 
          x: 0, 
          y: 0, 
          z: 0, 
          width: STICKY_NOTE.WIDTH, 
          height: STICKY_NOTE.HEIGHT, 
          expanded: false 
        },
      })),
    ];

    setItems(calculateInitialLayout(initialItems));
  }, [albums, snips, playlists, setItems]);

  useEffect(() => {
    initializeItems();
  }, [initializeItems]);

  const onDragStart = useCallback(
    (id: string, event: React.MouseEvent) => {
      handleDragStart(id, event);
    },
    [handleDragStart]
  );

  // Use the focus hook on visible (filtered) items
  const filteredItems = filterItems(items);
  const { currentIndex, onFocusPrev, onFocusNext, focusOnCard } = useCardFocus(filteredItems, transform, updateTransform);
  const focusedCardId = filteredItems.length ? filteredItems[currentIndex].id : undefined;

  // Add explicit mobile setup and error handling
  useEffect(() => {
    const initializeMobileView = () => {
      try {
        const isMobile = window.innerWidth < 768;
        console.log('Initializing mobile view:', {isMobile, width: window.innerWidth});
        
        if (isMobile) {
          // Set a more conservative initial scale for mobile
          updateTransform({ 
            x: 0, 
            y: 0, 
            scale: 0.15 // Reduced from 0.2 
          }, false);
        }
      } catch (err) {
        console.error('Mobile initialization failed:', err);
      }
    };

    // Ensure DOM is ready
    if (document.readyState === 'complete') {
      initializeMobileView();
    } else {
      window.addEventListener('load', initializeMobileView);
      return () => window.removeEventListener('load', initializeMobileView);
    }
  }, [updateTransform]);

  // Separate the delayed focus into its own effect
  useEffect(() => {
    if (window.innerWidth < 768 && items.length > 0) {
      const timer = setTimeout(() => {
        focusOnCard(0);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [items.length]); // Only depend on items.length changing

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault(); // Prevent default zoom behavior
    if (e.touches.length === 1) {
      handleGestureStart(e);
    }
  }, [handleGestureStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      handleGestureMove(e);
    }
  }, [handleGestureMove]);

  return (
    <>
      <div className="fixed inset-0">
        <WindowBackground transform={transform} isTransitioning={isTransitioning} />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transition: isTransitioning
              ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              : 'none',
            overscrollBehavior: 'none', // Prevent pull-to-refresh
            WebkitOverflowScrolling: 'touch' // Improve iOS scrolling
          }}
          onWheel={handleWheel}
          onMouseDown={handleGestureStart}
          onMouseMove={handleGestureMove}
          onMouseUp={handleGestureEnd}
          onMouseLeave={handleGestureEnd}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleGestureEnd}
        >
          <WhiteboardContainer
            transform={transform}
            isTransitioning={isTransitioning}
            width={WINDOW_DIMENSIONS.WIDTH}
            height={WINDOW_DIMENSIONS.HEIGHT}
          >

            <WhiteboardContent
              items={filteredItems}
              focusedCardId={focusedCardId}
              draggingId={dragging}
              resizingId={resizing}
              onDragStart={onDragStart}
              onDragEnd={handleDragEnd}
              onExpand={handleExpand}
              onResize={handleResizeStart} // realtime resize handler
              photosByAlbum={photosByAlbum as Record<string, PhotoData[]>} // Ensure type matches
            />
          </WhiteboardContainer>
        </div>

        <WhiteboardToolbar
          onFilter={toggleFilter}
          onZoomIn={(animate) => handleZoomIn(animate)}
          onZoomOut={(animate) => handleZoomOut(animate)}
          onCenter={centerView}
          scale={transform.scale}
          minScale={SCALES.MIN}
          onFocusPrev={onFocusPrev}
          onFocusNext={onFocusNext}
        />
      </div>
    </>
  );
}