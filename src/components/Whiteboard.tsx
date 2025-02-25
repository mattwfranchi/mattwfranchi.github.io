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
import ErrorBoundary from './ErrorBoundary';
import { performanceLogger } from '../utils/performanceLogger';

// Debug flag to control logging
const DEBUG = false;

export default function WhiteboardLayout({
  albums,
  photosByAlbum,
  playlists,
  snips,
  backgroundImage,
}: WhiteboardProps) {
  // Consolidate performance monitoring into a single effect
  useEffect(() => {
    if (DEBUG) {
      performanceLogger.start();
      performanceLogger.mark('whiteboard_mount_start');

      // Single performance observer for all monitoring
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          // Log only significant performance issues
          if (entry.duration > 100) {
            console.warn(`[Performance] Long task: ${entry.duration.toFixed(2)}ms`, {
              name: entry.name,
              startTime: entry.startTime
            });
          }
        });
      });

      observer.observe({ entryTypes: ['longtask', 'measure'] });

      // Log initial mount data
      console.log('[Mount] Data sizes:', {
        albums: albums.length,
        photos: Object.values(photosByAlbum).flat().length,
        playlists: playlists.length,
        snips: snips.length
      });

      return () => {
        observer.disconnect();
        performanceLogger.mark('whiteboard_mount_end');
        performanceLogger.measure(
          'whiteboard_mount_duration',
          'whiteboard_mount_start',
          'whiteboard_mount_end'
        );
      };
    }
  }, []);

  const {
    items,
    setItems,
    dragging,
    resizing,
    handleDragStart,
    handleDragEnd,
    handleResizeStart, // realtime drag-to-resize handler
    handleExpand,      // click-to-toggle expand handler
    handleLongPress,   // long press handler
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

  // Add performance tracking to initializeItems
  const initializeItems = useCallback(() => {
    if (DEBUG) {
      performanceLogger.mark('initialize_items_start');
    }
    
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

    if (DEBUG) {
      performanceLogger.mark('calculate_layout_start');
    }
    
    const layoutedItems = calculateInitialLayout(initialItems);
    
    if (DEBUG) {
      performanceLogger.mark('calculate_layout_end');
      performanceLogger.measure('layout_calculation', 'calculate_layout_start', 'calculate_layout_end');
    }

    setItems(layoutedItems);
    
    if (DEBUG) {
      performanceLogger.mark('initialize_items_end');
      performanceLogger.measure('items_initialization', 'initialize_items_start', 'initialize_items_end');
    }
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

  // Optimize mobile initialization
  const initializeMobileView = useCallback(() => {
    if (window.innerWidth < 768) {
      requestAnimationFrame(() => {
        updateTransform({ x: 0, y: 0, scale: 0.2 }, false);
      });
    }
  }, [updateTransform]);

  useEffect(() => {
    initializeMobileView();
  }, [initializeMobileView]);

  // Separate the delayed focus into its own effect
  useEffect(() => {
    if (window.innerWidth < 768 && items.length > 0) {
      const timer = setTimeout(() => {
        focusOnCard(0);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [items.length, focusOnCard]); // Only depend on items.length changing

  // Add memory monitoring with warning thresholds - DISABLED by default now
  useEffect(() => {
    if (!DEBUG) return;
    
    const memoryCheck = () => {
      if ('memory' in performance) {
        // @ts-ignore - performance.memory is Chrome-specific
        const { usedJSHeapSize, jsHeapSizeLimit } = performance.memory;
        const usedMemoryMB = Math.round(usedJSHeapSize / 1024 / 1024);
        const totalMemoryMB = Math.round(jsHeapSizeLimit / 1024 / 1024);
        const memoryUsagePercent = (usedMemoryMB / totalMemoryMB) * 100;

        console.log(`[Memory] Usage: ${usedMemoryMB}MB / ${totalMemoryMB}MB (${memoryUsagePercent.toFixed(1)}%)`);

        // Warning thresholds
        if (memoryUsagePercent > 80) {
          console.warn('[Memory] Warning: High memory usage detected');
        }
        if (memoryUsagePercent > 90) {
          console.error('[Memory] Critical: Memory usage extremely high');
        }
      }
    };

    const interval = setInterval(memoryCheck, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ErrorBoundary>
      <div className="fixed inset-0">
        <WindowBackground transform={transform} isTransitioning={isTransitioning} />
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
            onLongPress={handleLongPress} // Pass the new prop
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
}