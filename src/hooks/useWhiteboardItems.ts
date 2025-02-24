import { useState, useCallback, useRef } from 'react';
import type { WhiteboardItem } from '../types/whiteboard';
import { STICKY_NOTE } from '../constants/whiteboard';

interface DragState {
  itemId: string | null;
  initialMousePos: { x: number; y: number } | null;
  initialItemPos: { x: number; y: number } | null;
  offset: { x: number; y: number } | null;
}

interface ResizeState {
  itemId: string | null;
  initialMousePos: { x: number; y: number } | null;
  initialWidth: number;
  initialHeight: number;
}

export const useWhiteboardItems = () => {
  const [items, setItems] = useState<WhiteboardItem[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);
  const [resizing, setResizing] = useState<string | null>(null);
  const dragState = useRef<DragState>({
    itemId: null,
    initialMousePos: null,
    initialItemPos: null,
    offset: null
  });
  const resizeState = useRef<ResizeState>({
    itemId: null,
    initialMousePos: null,
    initialWidth: 0,
    initialHeight: 0
  });

  // Helper: Get current scale from container CSS variable
  const getContainerScale = () => {
    const container = document.querySelector('.whiteboard-container');
    if (!container) return 1;
    const computed = getComputedStyle(container);
    const scale = parseFloat(computed.getPropertyValue('--scale'));
    return isNaN(scale) ? 1 : scale;
  };

  const handleDragMove = useCallback((event: MouseEvent) => {
    const container = document.querySelector('.whiteboard-container');
    const rect = container ? container.getBoundingClientRect() : { left: 0, top: 0 };
    const scale = getContainerScale();
    const relativeX = (event.clientX - rect.left) / scale;
    const relativeY = (event.clientY - rect.top) / scale;
    const { itemId, offset } = dragState.current;
    if (!itemId || !offset) return;
    const newPosition = {
      x: relativeX - offset.x,
      y: relativeY - offset.y
    };
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId
          ? { ...item, position: { ...item.position, x: newPosition.x, y: newPosition.y } }
          : item
      )
    );
  }, []);

  const handleDragEnd = useCallback(() => {
    window.removeEventListener('mousemove', handleDragMove);
    window.removeEventListener('mouseup', handleDragEnd);
    setDragging(null);
    dragState.current = {
      itemId: null,
      initialMousePos: null,
      initialItemPos: null,
      offset: null
    };
  }, [handleDragMove]);

  const handleDragStart = useCallback((id: string, event: React.MouseEvent<Element>) => {
    event.preventDefault();
    const item = items.find(i => i.id === id);
    if (!item) return;
    const container = document.querySelector('.whiteboard-container');
    const rect = container ? container.getBoundingClientRect() : { left: 0, top: 0 };
    const scale = getContainerScale();
    const relativeMouseX = (event.clientX - rect.left) / scale;
    const relativeMouseY = (event.clientY - rect.top) / scale;
    const offset = {
      x: relativeMouseX - item.position.x,
      y: relativeMouseY - item.position.y
    };
    setDragging(id);
    dragState.current = {
      itemId: id,
      initialMousePos: { x: relativeMouseX, y: relativeMouseY },
      initialItemPos: { x: item.position.x, y: item.position.y },
      offset
    };
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
  }, [items, handleDragMove, handleDragEnd]);

  // Realtime drag-to-resize with click-to-stop behavior.
  const handleResizeMove = useCallback((event: MouseEvent) => {
    const { itemId, initialMousePos, initialWidth, initialHeight } = resizeState.current;
    if (!itemId || !initialMousePos) return;
    const container = document.querySelector('.whiteboard-container');
    const rect = container ? container.getBoundingClientRect() : { left: 0, top: 0 };
    const scale = getContainerScale();
    const relativeX = (event.clientX - rect.left) / scale;
    const relativeY = (event.clientY - rect.top) / scale;
    const deltaX = relativeX - initialMousePos.x;
    const deltaY = relativeY - initialMousePos.y;
    setItems(prevItems =>
      prevItems.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            position: {
              ...item.position,
              width: Math.max(50, initialWidth + deltaX),
              height: Math.max(50, initialHeight + deltaY)
            }
          };
        }
        return item;
      })
    );
  }, []);

  const handleResizeStart = useCallback((id: string, event: React.MouseEvent<Element>) => {
    event.preventDefault();

    // If this item is already being resized, then clicking again stops resizing.
    if (resizing === id) {
      window.removeEventListener('mousemove', handleResizeMove);
      setResizing(null);
      resizeState.current = {
        itemId: null,
        initialMousePos: null,
        initialWidth: 0,
        initialHeight: 0,
      };
      return;
    }

    const item = items.find(i => i.id === id);
    if (!item) return;
    const container = document.querySelector('.whiteboard-container');
    const rect = container ? container.getBoundingClientRect() : { left: 0, top: 0 };
    const scale = getContainerScale();
    const relativeMouseX = (event.clientX - rect.left) / scale;
    const relativeMouseY = (event.clientY - rect.top) / scale;
    resizeState.current = {
      itemId: id,
      initialMousePos: { x: relativeMouseX, y: relativeMouseY },
      initialWidth: item.position.width,
      initialHeight: item.position.height,
    };
    setResizing(id);
    window.addEventListener('mousemove', handleResizeMove);
    // Do not add mouseup or mouseleave listeners—resizing will stop on the next click.
  }, [items, handleResizeMove, resizing]);

  // Click-to-toggle expanded state (instant toggle)
  const handleExpand = useCallback((id: string) => {
    console.log('handleExpand triggered for item:', id);
    setItems(prevItems =>
      prevItems.map(item => {
        if (item.id === id) {
          const isExpanded = item.position.expanded;
          console.log('Toggling expand for', id, 'from', isExpanded, 'to', !isExpanded);
          return {
            ...item,
            position: {
              ...item.position,
              width: isExpanded ? STICKY_NOTE.WIDTH : STICKY_NOTE.WIDTH * 1.5,
              height: isExpanded ? STICKY_NOTE.HEIGHT : STICKY_NOTE.HEIGHT * 1.5,
              expanded: !isExpanded
            }
          };
        }
        return item;
      })
    );
  }, []);

  // Legacy click-to-resize (if needed)
  const handleResizeClick = useCallback((id: string) => {
    setItems(prevItems =>
      prevItems.map(item => {
        if (item.id === id) {
          const isExpanded = item.position.expanded;
          return {
            ...item,
            position: {
              ...item.position,
              width: isExpanded ? STICKY_NOTE.WIDTH : STICKY_NOTE.WIDTH * 1.5,
              height: isExpanded ? STICKY_NOTE.HEIGHT : STICKY_NOTE.HEIGHT * 1.5,
              expanded: !isExpanded
            }
          };
        }
        return item;
      })
    );
  }, []);

  return {
    items,
    setItems,
    dragging,
    resizing,
    handleDragStart,
    handleDragEnd,
    handleResizeStart,
    handleResizeClick,
    handleExpand,
  };
};