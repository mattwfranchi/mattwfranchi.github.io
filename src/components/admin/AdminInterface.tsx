import React, { useState, useEffect } from 'react';
import PhotoForm from './PhotoForm.tsx';
import AlbumForm from './AlbumForm.tsx';
import SnipForm from './SnipForm.tsx';
import PlaylistForm from './PlaylistForm.tsx';
import ContentList from './ContentList.tsx';
import { getContentList } from '../../utils/githubDirectService';

type ContentType = 'albums' | 'photos' | 'snips' | 'playlists';

interface AdminInterfaceProps {
  albums: any[];
  photos: any[];
  snips: any[];
  playlists: any[];
  gitHubToken: string;
}

const AdminInterface: React.FC<AdminInterfaceProps> = ({
  albums: initialAlbums,
  photos: initialPhotos,
  snips: initialSnips,
  playlists: initialPlaylists,
  gitHubToken
}) => {
  const [activeTab, setActiveTab] = useState<ContentType>('albums');
  const [contentMode, setContentMode] = useState<'list' | 'create'>('list');
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  // State for content lists
  const [albums, setAlbums] = useState(initialAlbums || []);
  const [photos, setPhotos] = useState(initialPhotos || []);
  const [snips, setSnips] = useState(initialSnips || []);
  const [playlists, setPlaylists] = useState(initialPlaylists || []);
  
  // Loading state for data refreshes
  const [isLoading, setIsLoading] = useState(false);

  const handleTabClick = (tab: ContentType) => {
    setActiveTab(tab);
    setContentMode('list');
    refreshContent(tab);
  };
  
  // Function to refresh content when needed
  const refreshContent = async (type: ContentType = activeTab) => {
    setIsLoading(true);
    try {
      const result = await getContentList(gitHubToken, type);
      if (result.success && result.items) {
        switch (type) {
          case 'albums':
            setAlbums(result.items);
            break;
          case 'photos':
            setPhotos(result.items);
            break;
          case 'snips':
            setSnips(result.items);
            break;
          case 'playlists':
            setPlaylists(result.items);
            break;
        }
      } else if (result.error) {
        showNotification(`Failed to load ${type}: ${result.error}`, 'error');
      }
    } catch (error) {
      showNotification(`Error loading content: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initialize with up-to-date data from GitHub
  useEffect(() => {
    if (gitHubToken) {
      refreshContent(activeTab);
    }
  }, [gitHubToken]);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({
      message,
      type
    });
    
    // Scroll to top to show the notification
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const handleCreateSuccess = (message: string) => {
    setContentMode('list');
    showNotification(message, 'success');
    console.log('Success:', message);
    // Refresh the content list after creation
    refreshContent();
  };

  const handleError = (message: string) => {
    showNotification(message, 'error');
    console.error('Error:', message);
  };

  const renderContent = () => {
    if (contentMode === 'create') {
      switch (activeTab) {
        case 'albums':
          return <AlbumForm onSuccess={handleCreateSuccess} onError={handleError} gitHubToken={gitHubToken} />;
        case 'photos':
          return <PhotoForm albums={albums} onSuccess={handleCreateSuccess} onError={handleError} gitHubToken={gitHubToken} />;
        case 'snips':
          return <SnipForm albums={albums} onSuccess={handleCreateSuccess} onError={handleError} gitHubToken={gitHubToken} />;
        case 'playlists':
          return <PlaylistForm albums={albums} onSuccess={handleCreateSuccess} onError={handleError} gitHubToken={gitHubToken} />;
      }
    }

    // List view
    let items;
    switch (activeTab) {
      case 'albums':
        items = albums;
        break;
      case 'photos':
        items = photos;
        break;
      case 'snips':
        items = snips;
        break;
      case 'playlists':
        items = playlists;
        break;
    }
    
    return (
      <ContentList 
        type={activeTab} 
        items={items} 
        isLoading={isLoading} 
        onRefresh={() => refreshContent(activeTab)} 
      />
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Brain Admin Interface</h1>
      
      {/* Notification */}
      {notification && (
        <div className={`mb-4 p-4 rounded ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {notification.message}
        </div>
      )}
      
      {/* Tab navigation */}
      <div className="flex border-b mb-6">
        {(['albums', 'photos', 'snips', 'playlists'] as ContentType[]).map((tab) => (
          <button 
            key={tab}
            onClick={() => handleTabClick(tab)}
            className={`py-2 px-6 text-lg ${
              activeTab === tab 
                ? 'border-b-2 border-indigo-500 text-indigo-600 font-medium' 
                : 'text-gray-500 hover:text-gray-700'
            }`}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
      
      {/* Action buttons */}
      <div className="flex justify-end mb-6">
        {contentMode === 'list' ? (
          <button
            onClick={() => setContentMode('create')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Create New {activeTab.slice(0, -1)}
          </button>
        ) : (
          <button
            onClick={() => setContentMode('list')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to List
          </button>
        )}
      </div>
      
      {/* Content area */}
      <div className="bg-white rounded-lg shadow p-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminInterface;
