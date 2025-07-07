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
import { STICKY_NOTE, SCALES } from '../constants/whiteboard';
import { calculateInitialLayout } from '../utils/itemLayoutUtils';
import ErrorBoundary from './ErrorBoundary';

// Debug flag to control logging
const DEBUG = false;

export default function WhiteboardLayout({
  albums,
  photosByAlbum,
  playlists,
  snips,
}: WhiteboardProps) {
  // Simplified performance monitoring
  useEffect(() => {
    if (DEBUG) {
      console.log('[Mount] Data sizes:', {
        albums: albums.length,
        photos: Object.values(photosByAlbum).flat().length,
        playlists: playlists.length,
        snips: snips.length
      });
    }
  }, []);

  const {
    items,
    setItems,
    dragging,
    resizing,
    handleDragStart,
    handleDragEnd,
    handleResizeStart,
    handleExpand,
    handleLongPress,
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

  // Simplified item initialization
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

    const layoutedItems = calculateInitialLayout(initialItems);
    setItems(layoutedItems);
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

  // Simplified mobile initialization
  const initializeMobileView = useCallback(() => {
    requestAnimationFrame(() => {
      updateTransform({ x: 0, y: 0, scale: 0.3 }, false);
    });
  }, [updateTransform]);

  useEffect(() => {
    initializeMobileView();
  }, [initializeMobileView]);

  // Auto-focus on first item once on initial load only
  useEffect(() => {
    if (items.length > 0) {
      const timer = setTimeout(() => {
        focusOnCard(0);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [items.length]); // Removed focusOnCard from dependencies to prevent re-triggering

  return (
    <ErrorBoundary>
      {/* Simple clean background without window */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-800 to-slate-900">
        <div
          className={`transform-container ${isTransitioning ? 'is-transitioning' : ''}`}
          style={{
            "--translateX": `${transform.x}px`,
            "--translateY": `${transform.y}px`,
            "--scale": transform.scale,
          } as React.CSSProperties}
          onWheel={handleWheel}
          onMouseDown={handleGestureStart}
          onMouseMove={handleGestureMove}
          onMouseUp={handleGestureEnd}
          onMouseLeave={handleGestureEnd}
          onTouchStart={handleGestureStart}
          onTouchMove={handleGestureMove}
          onTouchEnd={handleGestureEnd}
        >
          <WhiteboardContent
            items={filteredItems}
            focusedCardId={focusedCardId}
            draggingId={dragging}
            resizingId={resizing}
            onDragStart={onDragStart}
            onDragEnd={handleDragEnd}
            onExpand={handleExpand}
            onResize={handleResizeStart}
            onLongPress={handleLongPress}
            photosByAlbum={photosByAlbum}
          />
        </div>
        
        <WhiteboardToolbar
          onFilter={toggleFilter}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onCenter={centerView}
          scale={transform.scale}
          minScale={SCALES.MIN}
          onFocusPrev={onFocusPrev}
          onFocusNext={onFocusNext}
        />
      </div>
    </ErrorBoundary>
  );
};