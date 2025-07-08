import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { WhiteboardProps, WhiteboardItem, PhotoData, Transform } from '../types/whiteboard';
import { WhiteboardContainer } from './whiteboard/WhiteboardContainer';
import { WhiteboardContent } from './whiteboard/WhiteboardContent';
import { WhiteboardToolbar } from './whiteboard/WhiteboardToolbar';
import { WhiteboardGrid } from './whiteboard/WhiteboardGrid';
import { useWhiteboardItems } from '../hooks/useWhiteboardItems';
import { useWhiteboardView } from '../hooks/useWhiteboardView';
import { useWhiteboardGestures } from '../hooks/useWhiteboardGestures';
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
    transform,
    isTransitioning,
    updateTransform,
    handleWheel,
    handleZoomIn,
    handleZoomOut,
    centerView,
  } = useWhiteboardView();

  // Create zoom-to-fit function for mobile card expansion
  const handleZoomToFit = useCallback((cardElement: HTMLElement, expanded: boolean) => {
    if (!expanded) return; // Only zoom when expanding
    
    // Get the card's dimensions after expansion
    const cardRect = cardElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate what scale would fit the card with padding
    const padding = 60; // More padding for better mobile viewing
    const requiredWidth = cardRect.width + padding * 2;
    const requiredHeight = cardRect.height + padding * 2;
    
    const scaleX = viewportWidth / requiredWidth;
    const scaleY = viewportHeight / requiredHeight;
    
    // Use the smaller scale to ensure the card fits in both dimensions
    const targetScale = Math.min(scaleX, scaleY, transform.scale);
    
    // Only proceed if we need to zoom out (don't zoom in)
    if (targetScale < transform.scale) {
      // IMPORTANT: Only zoom out, don't recenter the camera
      // This preserves the user's current view and navigation context
      const newTransform: Transform = {
        x: transform.x,
        y: transform.y,
        scale: targetScale
      };
      
      console.log('Auto-zooming out to fit expanded card:', {
        currentTransform: transform,
        targetScale,
        newTransform,
        cardSize: { width: cardRect.width, height: cardRect.height }
      });
      
      // Apply just the zoom, preserving current camera position
      updateTransform(newTransform, true);
    }
  }, [transform, updateTransform]);

  const {
    items,
    setItems,
    dragging,

    handleDragStart,
    handleDragEnd,

    handleExpand,
    handleLongPress,
  } = useWhiteboardItems({
    onZoomToFit: handleZoomToFit
  });

  // Use the focus hook on all items (no filtering)
  const { currentIndex, onFocusPrev, onFocusNext, focusOnCard } = useCardFocus(items, transform, updateTransform);
  const focusedCardId = items.length ? items[currentIndex].id : undefined;

  // Track if initial focus has been completed
  const hasInitialFocusedRef = useRef(false);

  // Check if we're on mobile
  const isMobile = typeof window !== 'undefined' && (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
    window.innerWidth <= 768
  );

  const {
    handleGestureStart,
    handleGestureMove,
    handleGestureEnd,
    isDragging: isPanning,
  } = useWhiteboardGestures(updateTransform);

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

  // Initialize view based on device type
  const initializeView = useCallback(() => {
    if (isMobile) {
      // On mobile, start with a lower scale and no offset
      // We'll let the auto-focus handle proper centering
      requestAnimationFrame(() => {
        updateTransform({ x: 0, y: 0, scale: 0.5 }, false);
      });
    } else {
      // On desktop, use the default centered view
      requestAnimationFrame(() => {
        updateTransform({ x: 0, y: 0, scale: 0.3 }, false);
      });
    }
  }, [updateTransform, isMobile]);

  useEffect(() => {
    initializeView();
  }, [initializeView]);

  // Auto-focus on first item - ensure proper timing and only run once
  useEffect(() => {
    if (items.length > 0 && !hasInitialFocusedRef.current) {
      const timer = setTimeout(() => {
        focusOnCard(0);
        hasInitialFocusedRef.current = true; // Mark as completed
      }, isMobile ? 500 : 1000); // Faster on mobile for better UX
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, isMobile]); // Only re-run when items are first loaded or mobile changes

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
          // Disable manual gestures on mobile, keep them on desktop
          {...(!isMobile && {
            onWheel: handleWheel,
            onMouseDown: handleGestureStart,
            onMouseMove: handleGestureMove,
            onMouseUp: handleGestureEnd,
            onMouseLeave: handleGestureEnd,
            onTouchStart: handleGestureStart,
            onTouchMove: handleGestureMove,
            onTouchEnd: handleGestureEnd,
          })}
        >
          <WhiteboardContent
            items={items}
            focusedCardId={focusedCardId}
            draggingId={dragging}
            onDragStart={onDragStart}
            onDragEnd={handleDragEnd}
            onExpand={handleExpand}
            onLongPress={handleLongPress}
            photosByAlbum={photosByAlbum}
          />
        </div>
        
        <WhiteboardToolbar
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