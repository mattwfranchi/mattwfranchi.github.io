import React, { useState, useEffect } from 'react';
import { generateContentFile, commitFile } from '../../utils/githubService';

interface PlaylistFormProps {
  albums: any[];
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  gitHubToken: string;
}

const PlaylistForm: React.FC<PlaylistFormProps> = ({ albums, onSuccess, onError, gitHubToken }) => {
  const [formData, setFormData] = useState({
    albumId: '',
    title: '',
    description: '',
    pubDatetime: new Date().toISOString().split('T')[0],
    platform: 'spotify',
    playlistUrl: '',
    featured: false,
    draft: false,
    tags: '',
    coverImage: '',
    mood: '',
    order: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [embedPreview, setEmbedPreview] = useState<string | null>(null);

  // Extract the playlist ID for embed preview
  useEffect(() => {
    if (formData.playlistUrl && formData.platform === 'spotify') {
      try {
        const url = new URL(formData.playlistUrl);
        const path = url.pathname;
        const playlistMatch = path.match(/playlist\/([a-zA-Z0-9]+)/);
        if (playlistMatch && playlistMatch[1]) {
          const playlistId = playlistMatch[1];
          setEmbedPreview(`https://open.spotify.com/embed/playlist/${playlistId}`);
          return;
        }
      } catch (e) {
        setEmbedPreview(null);
      }
    } else if (formData.playlistUrl && formData.platform === 'apple') {
      // Example Apple Music embed URL structure
      if (formData.playlistUrl.includes('music.apple.com')) {
        setEmbedPreview(formData.playlistUrl.replace('music.apple.com', 'embed.music.apple.com'));
        return;
      }
    }
    
    setEmbedPreview(null);
  }, [formData.playlistUrl, formData.platform]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.playlistUrl) {
      onError('Please enter a playlist URL');
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Use environment token if available, fall back to provided token
      const token = import.meta.env.VITE_GITHUB_TOKEN || gitHubToken;
      
      // Convert tags and mood strings to arrays
      const tagsArray = formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [];
      const moodArray = formData.mood ? formData.mood.split(',').map(mood => mood.trim()) : [];
      
      // Format data for content file
      const contentData = {
        ...formData,
        tags: tagsArray,
        mood: moodArray,
        pubDatetime: formData.pubDatetime || new Date().toISOString().split('T')[0],
      };
      
      // Generate the content file
      const contentFile = generateContentFile('playlists', contentData);
      
      // Commit the file to GitHub
      const result = await commitFile(token, contentFile);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to create playlist');
      }
      
      onSuccess('Playlist created successfully!');
      
      // Reset form
      setFormData({
        albumId: '',
        title: '',
        description: '',
        pubDatetime: new Date().toISOString().split('T')[0],
        platform: 'spotify',
        playlistUrl: '',
        featured: false,
        draft: false,
        tags: '',
        coverImage: '',
        mood: '',
        order: ''
      });
    } catch (error) {
      console.error('Error creating playlist:', error);
      onError((error as Error).message || 'Failed to create playlist');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Create New Playlist</h2>
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
              Platform
            </label>
            <select
              name="platform"
              value={formData.platform}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="spotify">Spotify</option>
              <option value="apple">Apple Music</option>
            </select>
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
              required
              placeholder="https://open.spotify.com/playlist/..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          {embedPreview && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preview
              </label>
              <div className="mt-2 bg-gray-50 border rounded-md p-2">
                <iframe
                  src={embedPreview}
                  width="100%"
                  height="352"
                  frameBorder="0"
                  allow="encrypted-media"
                  title="Playlist Preview"
                  className="rounded-md"
                ></iframe>
              </div>
            </div>
          )}
          
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
                  {album.data.title}
                </option>
              ))}
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
              Description*
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            ></textarea>
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
              placeholder="tag1, tag2, tag3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mood (comma separated)
            </label>
            <input
              type="text"
              name="mood"
              value={formData.mood}
              onChange={handleChange}
              placeholder="chill, focus, energetic"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cover Image URL (optional)
            </label>
            <input
              type="text"
              name="coverImage"
              value={formData.coverImage}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
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
            disabled={isSubmitting}
            className={`px-4 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? 'Creating...' : 'Create Playlist'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PlaylistForm;