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

    // Get card center in whiteboard space, adjusted for current scale
    const cardCenterX = card.position.x + (card.position.width / 2);
    const cardCenterY = card.position.y + (card.position.height / 2);

    // Get the whiteboard container center
    const containerCenterX = WINDOW_DIMENSIONS.WIDTH / 2;
    const containerCenterY = WINDOW_DIMENSIONS.HEIGHT / 2;

    // Calculate the offset needed to center the card
    // We need to account for the current scale when calculating the offset
    const offsetX = cardCenterX - containerCenterX;
    const offsetY = cardCenterY - containerCenterY;

    console.group('Card Focus Calculation');
    console.log('Card Position:', {
      x: card.position.x,
      y: card.position.y,
      width: card.position.width,
      height: card.position.height
    });
    console.log('Card Center:', { x: cardCenterX, y: cardCenterY });
    console.log('Container Center:', { x: containerCenterX, y: containerCenterY });
    console.log('Offset from center:', { x: offsetX, y: offsetY });
    console.log('Current Transform:', currentTransform);

    const newTransform: Transform = {
      x: -offsetX * FIXED_ZOOM, // Scale the offset
      y: -offsetY * FIXED_ZOOM,
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