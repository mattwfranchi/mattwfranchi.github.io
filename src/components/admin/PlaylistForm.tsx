import React, { useState } from 'react';
import { createContent, validateToken } from '../../utils/githubDirectService';

interface PlaylistFormProps {
  albums: any[];
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  gitHubToken: string;
  onRefresh?: () => void; // Optional callback to refresh content after creation
}

const PlaylistForm: React.FC<PlaylistFormProps> = ({ 
  albums, 
  onSuccess, 
  onError, 
  gitHubToken,
  onRefresh 
}) => {
  const [formData, setFormData] = useState({
    albumId: '',
    title: '',
    description: '',
    platform: 'spotify',
    playlistUrl: '',
    pubDatetime: new Date().toISOString().split('T')[0],
    featured: false,
    draft: false,
    tags: '',
    order: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTokenValidating, setIsTokenValidating] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Extract playlist ID from the URL
  const extractPlaylistId = (url: string, platform: string): string | null => {
    try {
      if (platform === 'spotify') {
        // Handle Spotify URLs
        // Format: https://open.spotify.com/playlist/37i9dQZF1DX0XUsuxWHRQd
        if (url.includes('/playlist/')) {
          const parts = url.split('/playlist/');
          if (parts.length > 1) {
            // Remove any query parameters
            return parts[1].split('?')[0];
          }
        }
      } else if (platform === 'apple') {
        // Handle Apple Music URLs
        // Format: https://music.apple.com/us/playlist/todays-hits/pl.f4d106fed2bd41149aaacabb233eb5eb
        if (url.includes('/playlist/')) {
          const parts = url.split('/playlist/');
          if (parts.length > 1) {
            const idPart = parts[1].split('/');
            // Return the last part which should be the ID
            return idPart[idPart.length - 1].split('?')[0];
          }
        }
      }
    } catch (error) {
      console.error('Error extracting playlist ID:', error);
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Make sure we have the token
      if (!gitHubToken) {
        throw new Error('GitHub token is missing');
      }
      
      // Validate the token first
      setIsTokenValidating(true);
      const validationResult = await validateToken(gitHubToken);
      setIsTokenValidating(false);
      
      if (!validationResult.valid) {
        throw new Error(`Token validation failed: ${validationResult.message || 'Unknown error'}`);
      }
      
      // Validate the URL and extract the ID
      const playlistId = extractPlaylistId(formData.playlistUrl, formData.platform);
      if (!playlistId) {
        throw new Error('Could not extract playlist ID from URL. Please check the format.');
      }

      // Convert tags string to array
      const tagsArray = formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [];
      
      // Generate unique ID for the playlist
      const uniqueId = `playlist_${Date.now()}`;
      
      // Format data for content file
      const contentData = {
        id: uniqueId,
        title: formData.title,
        description: formData.description,
        platform: formData.platform,
        playlistUrl: formData.playlistUrl,
        playlistId: playlistId, // Store the extracted playlist ID
        pubDatetime: formData.pubDatetime || new Date().toISOString(),
        albumId: formData.albumId || undefined,
        featured: formData.featured,
        draft: formData.draft,
        tags: tagsArray,
        order: formData.order ? parseInt(formData.order) : undefined
      };
      
      console.log("Creating playlist content:", contentData.title);
      
      // Use the direct GitHub API service
      const result = await createContent('playlists', contentData, gitHubToken);
      
      if (result.success) {
        onSuccess(result.message || 'Playlist created successfully!');
        
        // Reset form
        setFormData({
          albumId: '',
          title: '',
          description: '',
          platform: 'spotify',
          playlistUrl: '',
          pubDatetime: new Date().toISOString().split('T')[0],
          featured: false,
          draft: false,
          tags: '',
          order: ''
        });
        
        // Call refresh callback if provided
        if (onRefresh) {
          onRefresh();
        }
      } else {
        onError(result.error || 'Failed to create playlist');
      }
    } catch (error) {
      console.error('Error creating playlist:', error);
      onError(error instanceof Error ? error.message : 'Failed to create playlist');
    } finally {
      setIsSubmitting(false);
      setIsTokenValidating(false); // Ensure token validation state is reset
    }
  };

  // Determine button text based on current state
  const buttonText = isTokenValidating ? 'Validating Token...' : 
                    isSubmitting ? 'Creating...' : 'Create Playlist';

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Add New Playlist</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title*
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Album (optional)
            </label>
            <select
              name="albumId"
              value={formData.albumId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">None</option>
              {albums.map(album => (
                <option key={album.id} value={album.id}>
                  {album.data?.title || album.title || album.id}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Platform*
            </label>
            <select
              name="platform"
              value={formData.platform}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="spotify">Spotify</option>
              <option value="apple">Apple Music</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Publication Date
            </label>
            <input
              type="date"
              name="pubDatetime"
              value={formData.pubDatetime}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Playlist URL*
            </label>
            <input
              type="url"
              name="playlistUrl"
              value={formData.playlistUrl}
              onChange={handleChange}
              placeholder={formData.platform === 'spotify' ? 
                'https://open.spotify.com/playlist/37i9dQZF1DX0XUsuxWHRQd' : 
                'https://music.apple.com/us/playlist/todays-hits/pl.f4d106fed2bd41149aaacabb233eb5eb'}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter the full playlist URL from {formData.platform === 'spotify' ? 'Spotify' : 'Apple Music'}
            </p>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            ></textarea>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order (optional)
            </label>
            <input
              type="number"
              name="order"
              value={formData.order}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="music, indie, rock"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div className="flex space-x-6">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="featured"
                checked={formData.featured}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Featured</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="draft"
                checked={formData.draft}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Draft</span>
            </label>
          </div>
        </div>
        
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting || isTokenValidating}
            className={`px-4 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${(isSubmitting || isTokenValidating) ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            {buttonText}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PlaylistForm;