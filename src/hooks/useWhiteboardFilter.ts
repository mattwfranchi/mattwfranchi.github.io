import { useState, useCallback } from 'react';
import type { WhiteboardItem } from '../types/whiteboard';

export function useWhiteboardFilter() {
  const [filter, setFilter] = useState<FilterType>('all');

  const toggleFilter = useCallback(() => {
    setFilter(prev => {
      switch (prev) {
        case 'all': return 'album';
        case 'album': return 'snip';
        case 'snip': return 'playlist';
        case 'playlist': return 'all';
        default: return 'all';
      }
    });
  }, []);

  const filterItems = useCallback((items: WhiteboardItem[]) => {
    return filter === 'all' ? items : items.filter(item => item.type === filter);
  }, [filter]);

  return {
    filter,
    toggleFilter,
    filterItems
  };
}