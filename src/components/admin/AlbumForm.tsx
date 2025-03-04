import React, { useState } from 'react';
import { generateContentFile, commitFile } from '../../utils/githubService';

interface AlbumFormProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  gitHubToken: string;
}

const AlbumForm: React.FC<AlbumFormProps> = ({ onSuccess, onError, gitHubToken }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    pubDatetime: new Date().toISOString().split('T')[0],
    featured: false,
    draft: false,
    tags: '',
    borderColor: '#ffffff',
    location: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Use environment token if available, fall back to provided token
      const token = import.meta.env.VITE_GITHUB_TOKEN || gitHubToken;
      
      // Convert tags string to array
      const tagsArray = formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [];
      
      // Format data for content file
      const contentData = {
        ...formData,
        tags: tagsArray,
        pubDatetime: formData.pubDatetime || new Date().toISOString().split('T')[0],
      };
      
      // Generate the content file
      const contentFile = generateContentFile('albums', contentData);
      
      // Commit the file to GitHub
      const result = await commitFile(token, contentFile);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to create album');
      }
      
      onSuccess('Album created successfully!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        pubDatetime: new Date().toISOString().split('T')[0],
        featured: false,
        draft: false,
        tags: '',
        borderColor: '#ffffff',
        location: ''
      });
    } catch (error) {
      console.error('Error creating album:', error);
      onError((error as Error).message || 'Failed to create album');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Create New Album</h2>
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
              rows={4}
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
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Border Color
            </label>
            <input
              type="color"
              name="borderColor"
              value={formData.borderColor}
              onChange={handleChange}
              className="w-full h-10 px-1 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            {isSubmitting ? 'Creating...' : 'Create Album'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AlbumForm;
