import { useState, useCallback, useEffect } from 'react';
import type { WhiteboardItem, Transform } from '../types/whiteboard';
import { WINDOW_DIMENSIONS } from '../constants/whiteboard';

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

    // In the transform-based coordinate system, the position already represents 
    // the center point of the card relative to the container's center (0,0)
    const cardCenterX = card.position.x;
    const cardCenterY = card.position.y;

    console.group('Card Focus Calculation');
    console.log('Card Position:', {
      x: card.position.x,
      y: card.position.y,
      width: card.position.width,
      height: card.position.height
    });
    console.log('Current Transform:', currentTransform);

    // In the transform-based system, to center the card,
    // we simply need to move the container's center to the card's position
    // by applying the negative of the card's position
    const newTransform: Transform = {
      x: -cardCenterX * FIXED_ZOOM,
      y: -cardCenterY * FIXED_ZOOM,
      scale: FIXED_ZOOM
    };

    console.log('New Transform:', newTransform);
    console.log('Final Camera Position:', {
      x: newTransform.x / newTransform.scale,
      y: newTransform.y / newTransform.scale
    });
    console.groupEnd();

    if (
      Math.abs(currentTransform.x - newTransform.x) < 0.1 &&
      Math.abs(currentTransform.y - newTransform.y) < 0.1 &&
      Math.abs(currentTransform.scale - newTransform.scale) < 0.1
    ) {
      console.log('Skipping transform - no significant change');
      return;
    }

    updateTransform(newTransform, true);
  }, [items, updateTransform, currentTransform]);

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