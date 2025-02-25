import { useState, useCallback, useRef } from 'react';
import type { WhiteboardItem } from '../types/whiteboard';
import { STICKY_NOTE } from '../constants/whiteboard';
import { useNavigate } from 'react-router-dom'; // Import useNavigate from react-router-dom

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

  const navigate = useNavigate(); // Initialize useNavigate

  // Helper: Get current scale from container CSS variable
  const getContainerScale = () => {
    // Change from '.whiteboard-container' to '.transform-container'
    const container = document.querySelector('.transform-container');
    if (!container) return 1;
    const computed = getComputedStyle(container);
    const scale = parseFloat(computed.getPropertyValue('--scale'));
    return isNaN(scale) ? 1 : scale;
  };

  // Update the handleDragMove function to use transform-centered coordinates
  const handleDragMove = useCallback((event: MouseEvent) => {
    const { itemId, offset } = dragState.current;
    if (!itemId || !offset) return;

    // Get transform container and its dimensions
    const container = document.querySelector('.transform-container');
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const scale = getContainerScale();
    
    // Calculate position relative to center of container
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Convert mouse position to coordinates relative to center
    const relativeX = (event.clientX - centerX) / scale;
    const relativeY = (event.clientY - centerY) / scale;
    
    // Apply the offset from initial click
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

  // Update handleDragStart to also use center-relative coordinates
  const handleDragStart = useCallback((id: string, event: React.MouseEvent<Element>) => {
    event.preventDefault();
    const item = items.find(i => i.id === id);
    if (!item) return;
    
    // Get transform container and its dimensions
    const container = document.querySelector('.transform-container');
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const scale = getContainerScale();
    
    // Calculate center of container
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Convert mouse position to coordinates relative to center
    const relativeMouseX = (event.clientX - centerX) / scale;
    const relativeMouseY = (event.clientY - centerY) / scale;
    
    // Calculate offset from item's position
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

  // Update handleResizeMove to use transform-container
  const handleResizeMove = useCallback((event: MouseEvent) => {
    const { itemId, initialMousePos, initialWidth, initialHeight } = resizeState.current;
    if (!itemId || !initialMousePos) return;
    
    // Change from '.whiteboard-container' to '.transform-container'
    const container = document.querySelector('.transform-container');
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const scale = getContainerScale();
    
    // Calculate position relative to center of container
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Convert to center-relative coordinates
    const relativeX = (event.clientX - centerX) / scale;
    const relativeY = (event.clientY - centerY) / scale;
    
    const deltaX = relativeX - initialMousePos.x;
    const deltaY = relativeY - initialMousePos.y;
    
    setItems(prevItems =>
      prevItems.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            position: {
              ...item.position,
              width: Math.max(50, initialWidth + deltaX * 2),
              height: Math.max(50, initialHeight + deltaY * 2)
            }
          };
        }
        return item;
      })
    );
  }, []);

  // Also fix handleResizeStart similarly
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
    
    const container = document.querySelector('.transform-container');
    const rect = container ? container.getBoundingClientRect() : { left: 0, top: 0, width: 0, height: 0 };
    const scale = getContainerScale();
    
    // Calculate position relative to center
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Convert mouse position to coordinates relative to center
    const relativeMouseX = (event.clientX - centerX) / scale;
    const relativeMouseY = (event.clientY - centerY) / scale;
    
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

  // New function to handle long press
  const handleLongPress = useCallback((id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    let path = '';
    switch (item.type) {
      case 'album':
        path = `/brain/album/${item.data.slug}`;
        break;
      case 'snip':
        path = `/brain/snip/${item.data.slug}`;
        break;
      case 'playlist':
        path = `/brain/playlist/${item.data.slug}`;
        break;
      default:
        break;
    }

    if (path) {
      navigate(path);
    }
  }, [items, navigate]);

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
    handleLongPress, // Export the new function
  };
};
