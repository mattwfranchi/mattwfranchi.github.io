import React, { useState, useEffect } from 'react';

interface ContentListProps {
  type: string;
  items: any[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

const ContentList: React.FC<ContentListProps> = ({ type, items, isLoading = false, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState(items);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  }>({
    key: 'pubDatetime',
    direction: 'desc'
  });

  useEffect(() => {
    // Filter items based on search term
    let filtered = [...items];
    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase();
      filtered = items.filter(item => {
        const title = item.data.title?.toLowerCase() || '';
        const description = item.data.description?.toLowerCase() || '';
        const tags = item.data.tags?.join(' ').toLowerCase() || '';
        
        return (
          title.includes(lowercaseSearch) ||
          description.includes(lowercaseSearch) ||
          tags.includes(lowercaseSearch) ||
          item.id.toLowerCase().includes(lowercaseSearch)
        );
      });
    }

    // Sort filtered items
    filtered.sort((a, b) => {
      const aValue = a.data[sortConfig.key];
      const bValue = b.data[sortConfig.key];
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    setFilteredItems(filtered);
  }, [items, searchTerm, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const renderTableHeader = () => {
    const headers: {[key: string]: string} = {
      albums: 'Album',
      photos: 'Photo',
      snips: 'Snip', 
      playlists: 'Playlist'
    };

    return (
      <tr>
        <th className="px-4 py-2 text-left">
          <button 
            onClick={() => handleSort('title')}
            className="font-medium text-gray-700 hover:text-indigo-600 flex items-center"
          >
            {headers[type]} Title
            {sortConfig.key === 'title' && (
              <span className="ml-1">
                {sortConfig.direction === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </button>
        </th>
        <th className="px-4 py-2 text-left">
          <button 
            onClick={() => handleSort('pubDatetime')}
            className="font-medium text-gray-700 hover:text-indigo-600 flex items-center"
          >
            Date
            {sortConfig.key === 'pubDatetime' && (
              <span className="ml-1">
                {sortConfig.direction === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </button>
        </th>
        <th className="px-4 py-2 text-left">Tags</th>
        <th className="px-4 py-2 text-center">Status</th>
      </tr>
    );
  };

  const renderItem = (item: any) => {
    const pubDate = new Date(item.data.pubDatetime).toLocaleDateString();
    const tags = item.data.tags || [];
    const isDraft = item.data.draft;
    const isFeatured = item.data.featured;

    return (
      <tr key={item.id} className="border-t hover:bg-gray-50">
        <td className="px-4 py-3">
          <div className="font-medium text-gray-800">{item.data.title || 'Untitled'}</div>
          <div className="text-sm text-gray-500 truncate max-w-xs">{item.id}</div>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">{pubDate}</td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-1">
            {tags.map((tag: string, idx: number) => (
              <span 
                key={idx} 
                className="inline-block px-2 py-1 text-xs bg-gray-100 rounded-full text-gray-700"
              >
                {tag}
              </span>
            ))}
          </div>
        </td>
        <td className="px-4 py-3 text-center">
          <div className="flex justify-center space-x-2">
            {isDraft ? (
              <span className="px-2 py-1 text-xs bg-yellow-100 rounded-full text-yellow-800">
                Draft
              </span>
            ) : (
              <span className="px-2 py-1 text-xs bg-green-100 rounded-full text-green-800">
                Published
              </span>
            )}
            {isFeatured && (
              <span className="px-2 py-1 text-xs bg-indigo-100 rounded-full text-indigo-800">
                Featured
              </span>
            )}
          </div>
        </td>
      </tr>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-500">No {type} found.</p>
        {onRefresh && (
          <button 
            onClick={onRefresh}
            className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center mx-auto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">{type.charAt(0).toUpperCase() + type.slice(1)}</h2>
        <div className="w-1/3">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
      
      {filteredItems.length > 0 ? (
        <div className="overflow-x-auto border rounded-md">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-50">
              {renderTableHeader()}
            </thead>
            <tbody>
              {filteredItems.map(renderItem)}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 border rounded-md bg-gray-50">
          {searchTerm ? (
            <p className="text-gray-500">No {type} found matching "{searchTerm}"</p>
          ) : (
            <p className="text-gray-500">No {type} created yet</p>
          )}
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-500">
        Showing {filteredItems.length} of {items.length} {type}
      </div>
    </div>
  );
};

export default ContentList;
