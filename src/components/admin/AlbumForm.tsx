import React, { useState } from 'react';
import type { FormEvent } from 'react';
import { createContent, validateToken } from '../../utils/githubDirectService';

interface AlbumFormProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  gitHubToken: string;
  onRefresh?: () => void; // Optional callback to refresh the list after creation
}

const AlbumForm: React.FC<AlbumFormProps> = ({ 
  onSuccess, 
  onError, 
  gitHubToken,
  onRefresh 
}) => {
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    date: '',
    tags: '',
    draft: false,
    featured: false,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTokenValidating, setIsTokenValidating] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Make sure we have a token
      if (!gitHubToken) {
        throw new Error("GitHub token is required");
      }
      
      // Validate the token first
      setIsTokenValidating(true);
      const validationResult = await validateToken(gitHubToken);
      setIsTokenValidating(false);
      
      if (!validationResult.valid) {
        throw new Error(`Token validation failed: ${validationResult.message || 'Unknown error'}`);
      }
      
      // Generate ID if not provided
      const albumId = formData.id || `album_${Date.now()}`;
      
      // Convert tags string to array
      const tagsArray = formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [];
      
      // Prepare data for submission
      const albumData = {
        id: albumId,
        title: formData.title,
        description: formData.description,
        date: formData.date ? new Date(formData.date).toISOString() : new Date().toISOString(),
        tags: tagsArray,
        draft: formData.draft,
        featured: formData.featured
      };
      
      // Use the direct GitHub service to create content
      const result = await createContent('albums', albumData, gitHubToken);
      
      if (result.success) {
        onSuccess(result.message || 'Album created successfully');
        
        // Reset form
        setFormData({
          id: '',
          title: '',
          description: '',
          date: '',
          tags: '',
          draft: false,
          featured: false
        });
        
        // Call refresh callback if provided
        if (onRefresh) {
          onRefresh();
        }
      } else {
        onError(result.error || 'Failed to create album');
      }
    } catch (error) {
      console.error("Error creating album:", error);
      onError(error instanceof Error ? error.message : "Unknown error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const buttonText = isTokenValidating ? 'Validating Token...' : 
                    isSubmitting ? 'Creating...' : 'Create Album';

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Create New Album</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Form fields - these remain unchanged */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="id" className="block text-sm font-medium text-gray-700 mb-1">
              Album ID (optional)
            </label>
            <input
              type="text"
              id="id"
              name="id"
              value={formData.id}
              onChange={handleChange}
              placeholder="Generated automatically if empty"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="mt-1 text-xs text-gray-500">Unique identifier for the album. Leave blank for auto-generation.</p>
          </div>
          
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="mt-1 text-xs text-gray-500">Defaults to today if left blank.</p>
          </div>
          
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="travel, photography, personal"
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

export default AlbumForm;
