import React, { useState } from 'react';
import { generateContentFile, commitFile } from '../../utils/githubService';

interface SnipFormProps {
  albums: any[];
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  gitHubToken: string;
}

const SnipForm: React.FC<SnipFormProps> = ({ albums, onSuccess, onError, gitHubToken }) => {
  const [formData, setFormData] = useState({
    albumId: '',
    title: '',
    description: '',
    pubDatetime: new Date().toISOString().split('T')[0],
    featured: false,
    draft: false,
    tags: '',
    source: '',
    sourceUrl: '',
    order: '',
    content: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setIsSubmitting(true);

    try {
      // Use only the token passed via props, not environment variable
      const token = gitHubToken;
      
      if (!token) {
        throw new Error("GitHub token is missing");
      }
      
      console.log("Using token:", token.substr(0, 4) + "..." + token.substr(-4)); // Log token prefix/suffix for debugging
      
      // Convert tags string to array
      const tagsArray = formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [];
      
      // Format data for content file
      const contentData = {
        ...formData,
        tags: tagsArray,
        pubDatetime: formData.pubDatetime || new Date().toISOString(),
      };
      
      console.log("Preparing to submit snip:", contentData.title);
      
      // Generate the content file
      const contentFile = generateContentFile('snips', contentData);
      console.log("Generated content file path:", contentFile.path);
      
      // Commit the file to GitHub
      console.log("Sending to GitHub API...");
      const result = await commitFile(token, contentFile);
      console.log("GitHub API response:", result);
      
      if (!result.success) {
        throw new Error(result.message || 'GitHub API failed to create snip');
      }
      
      onSuccess('Snip created successfully!');
      
      // Reset form
      setFormData({
        albumId: '',
        title: '',
        description: '',
        pubDatetime: new Date().toISOString().split('T')[0],
        featured: false,
        draft: false,
        tags: '',
        source: '',
        sourceUrl: '',
        order: '',
        content: ''
      });
    } catch (error) {
      console.error('Error creating snip:', error);
      onError((error as Error).message || 'Failed to create snip');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Create New Snip</h2>
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
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description*
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            ></textarea>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Source (optional)
            </label>
            <input
              type="text"
              name="source"
              value={formData.source}
              onChange={handleChange}
              placeholder="e.g. Book or Author"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Source URL (optional)
            </label>
            <input
              type="url"
              name="sourceUrl"
              value={formData.sourceUrl}
              onChange={handleChange}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div className="md:col-span-2">
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
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content*
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              rows={10}
              placeholder="Enter your snip content here. Markdown is supported."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            ></textarea>
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
            {isSubmitting ? 'Creating...' : 'Create Snip'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SnipForm;
