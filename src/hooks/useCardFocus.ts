import { useState, useCallback, useEffect } from 'react';
import type { WhiteboardItem, Transform } from '../types/whiteboard';

interface UseCardFocusResult {
  currentIndex: number;
  onFocusPrev: () => void;
  onFocusNext: () => void;
  focusOnCard: (index: number) => void;
}

export function useCardFocus(
  items: WhiteboardItem[],
  currentTransform: Transform,
  updateTransform: (transform: Transform, animate?: boolean) => void
): UseCardFocusResult {
  const [currentIndex, setCurrentIndex] = useState(0);
  const FIXED_ZOOM = 1.5; // 150% zoom when focusing

  const focusOnCard = useCallback((index: number) => {
    if (items.length === 0) return;
    const clampedIndex = ((index % items.length) + items.length) % items.length;
    setCurrentIndex(clampedIndex);
    const card = items[clampedIndex];

    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Check if we're on mobile
    const isMobile = typeof window !== 'undefined' && (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
      viewportWidth <= 768
    );

    // Card position in whiteboard coordinates
    const cardCenterX = card.position.x;
    const cardCenterY = card.position.y;

    // Calculate the transform needed to center the card
    // The transform container is centered with translate(-50%, -50%), then gets additional translation
    // To center a card at position (cardX, cardY), we need: transform.x = -cardX * scale, transform.y = -cardY * scale
    let targetX = -cardCenterX * FIXED_ZOOM;
    let targetY = -cardCenterY * FIXED_ZOOM;

    // On mobile, apply bounds checking to ensure the card doesn't go off-screen
    if (isMobile) {
      // Calculate reasonable bounds based on viewport
      // Account for the fact that the transform container is already centered
      const maxTranslateX = viewportWidth * 0.4; // Allow 40% of viewport width as max translation
      const maxTranslateY = viewportHeight * 0.4; // Allow 40% of viewport height as max translation
      
      // Clamp the transform values to keep cards reasonably centered on mobile
      targetX = Math.max(-maxTranslateX, Math.min(maxTranslateX, targetX));
      targetY = Math.max(-maxTranslateY, Math.min(maxTranslateY, targetY));
      
      console.log('Mobile card focus:', {
        cardPosition: { x: cardCenterX, y: cardCenterY },
        calculatedTransform: { x: -cardCenterX * FIXED_ZOOM, y: -cardCenterY * FIXED_ZOOM },
        clampedTransform: { x: targetX, y: targetY },
        bounds: { maxTranslateX, maxTranslateY },
        viewport: { width: viewportWidth, height: viewportHeight }
      });
    }

    const newTransform: Transform = {
      x: targetX,
      y: targetY,
      scale: FIXED_ZOOM
    };

    // Apply the transform with smooth animation on all platforms
    updateTransform(newTransform, true);
  }, [items, updateTransform]); // Removed currentTransform dependency to prevent recreating function

  const onFocusPrev = useCallback(() => {
    focusOnCard(currentIndex - 1);
  }, [currentIndex, focusOnCard]);

  const onFocusNext = useCallback(() => {
    focusOnCard(currentIndex + 1);
  }, [currentIndex, focusOnCard]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        onFocusPrev();
      } else if (e.key === 'ArrowRight') {
        onFocusNext(); 
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onFocusPrev, onFocusNext]);

  return { currentIndex, onFocusPrev, onFocusNext, focusOnCard };
}