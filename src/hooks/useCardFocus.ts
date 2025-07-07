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
  
  // Check if we're on mobile for slower animations
  const isMobile = typeof window !== 'undefined' && (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
    window.innerWidth <= 768
  );

  const focusOnCard = useCallback((index: number) => {
    if (items.length === 0) return;
    const clampedIndex = ((index % items.length) + items.length) % items.length;
    setCurrentIndex(clampedIndex);
    const card = items[clampedIndex];

    // In the transform-based coordinate system, the position already represents 
    // the center point of the card relative to the container's center (0,0)
    const cardCenterX = card.position.x;
    const cardCenterY = card.position.y;

    // In the transform-based system, to center the card,
    // we simply need to move the container's center to the card's position
    // by applying the negative of the card's position
    const newTransform: Transform = {
      x: -cardCenterX * FIXED_ZOOM,
      y: -cardCenterY * FIXED_ZOOM,
      scale: FIXED_ZOOM
    };

    // On mobile, add a CSS class for slower card navigation animation
    if (isMobile) {
      const container = document.querySelector('.transform-container');
      if (container) {
        container.classList.add('mobile-card-navigation');
        // Remove the class after animation completes
        setTimeout(() => {
          container.classList.remove('mobile-card-navigation');
        }, 1300); // Match our mobile animation duration + buffer
      }
    }

    // Always apply the transform - let the updateTransform function handle optimization
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