import React, { useState, useEffect } from 'react';
import { createContent, validateToken, updateContent } from '../../utils/githubDirectService';

interface SnipFormProps {
  albums: any[];
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  gitHubToken: string;
  onRefresh?: () => void; // Optional callback to refresh content after creation
  editMode?: boolean;
  initialData?: any;
  onCancel?: () => void;
}

const SnipForm: React.FC<SnipFormProps> = ({ 
  albums = [], // Added default empty array to prevent undefined errors
  onSuccess, 
  onError, 
  gitHubToken,
  onRefresh,
  editMode = false,
  initialData = null,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    albumId: '',
    title: '',
    description: '',
    pubDatetime: new Date().toISOString(), // Use full ISO format for schema compatibility
    featured: false,
    draft: false,
    tags: '',
    source: '',
    sourceUrl: '',
    order: '',
    content: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTokenValidating, setIsTokenValidating] = useState(false);
  const [formMessage, setFormMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Initialize form with data when in edit mode
  useEffect(() => {
    if (editMode && initialData) {
      console.log('Initial snip data for editing:', initialData);
      
      // Format date if available - check both direct and data nested properties
      let formattedDate = '';
      try {
        const dateValue = initialData.pubDatetime || initialData.date || 
                        (initialData.data && (initialData.data.pubDatetime || initialData.data.date));
        
        if (dateValue) {
          const date = new Date(dateValue);
          formattedDate = date.toISOString();
        } else {
          formattedDate = new Date().toISOString();
        }
      } catch (e) {
        console.error('Error parsing date:', e);
        formattedDate = new Date().toISOString();
      }
      
      // Get albumId from either direct property or data nested property
      const albumId = initialData.albumId || (initialData.data && initialData.data.albumId) || '';
      
      // Get title and other fields from either direct property or data nested property
      const title = initialData.title || (initialData.data && initialData.data.title) || '';
      const description = initialData.description || (initialData.data && initialData.data.description) || '';
      const featured = initialData.featured || (initialData.data && initialData.data.featured) || false;
      const draft = initialData.draft || (initialData.data && initialData.data.draft) || false;
      const source = initialData.source || (initialData.data && initialData.data.source) || '';
      const sourceUrl = initialData.sourceUrl || (initialData.data && initialData.data.sourceUrl) || '';
      const order = initialData.order || (initialData.data && initialData.data.order) || '';
      const content = initialData.content || initialData.body || '';
      
      // Get tags, ensure it's a comma-separated string for form
      let tags = '';
      const tagsArray = initialData.tags || (initialData.data && initialData.data.tags) || [];
      if (Array.isArray(tagsArray)) {
        tags = tagsArray.join(', ');
      }
      
      setFormData({
        albumId,
        title,
        description,
        pubDatetime: formattedDate,
        featured,
        draft,
        tags,
        source,
        sourceUrl,
        order: order ? String(order) : '',
        content
      });
    }
  }, [editMode, initialData]);

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
    setFormMessage(null);

    try {
      const token = gitHubToken;
      
      if (!token) {
        throw new Error("GitHub token is missing");
      }
      
      // Validate the token first
      setIsTokenValidating(true);
      const validationResult = await validateToken(token);
      setIsTokenValidating(false);
      
      if (!validationResult.valid) {
        throw new Error(`Token validation failed: ${validationResult.message || 'Unknown error'}`);
      }
      
      // Convert tags string to array
      const tagsArray = formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : ['untagged'];
      
      // Generate unique ID for the snip (if not in edit mode)
      const snipId = editMode && initialData ? initialData.id : `snip_${Date.now()}`;
      
      // Format data for content file
      const contentData = {
        id: snipId,
        title: formData.title,
        description: formData.description,
        pubDatetime: formData.pubDatetime, // Keep ISO format for date
        albumId: formData.albumId || undefined,
        featured: formData.featured,
        draft: formData.draft,
        tags: tagsArray,
        source: formData.source || undefined,
        sourceUrl: formData.sourceUrl || undefined,
        order: formData.order ? parseInt(formData.order) : undefined,
        content: formData.content,
        _sourceFile: editMode && initialData ? initialData._sourceFile : undefined
      };
      
      let result;
      
      if (editMode && initialData && initialData._sourceFile) {
        // Update existing snip
        result = await updateContent(initialData._sourceFile, contentData, token);
        if (result.success) {
          onSuccess('Snip updated successfully');
          
          // Call refresh callback if provided
          if (onRefresh) {
            onRefresh();
          }
        } else {
          throw new Error(result.error || 'Failed to update snip');
        }
      } else {
        // Create new snip
        result = await createContent('snips', contentData, token);
        
        if (result.success) {
          onSuccess(result.message || 'Snip created successfully!');
          
          // Reset form for new entries
          if (!editMode) {
            setFormData({
              albumId: '',
              title: '',
              description: '',
              pubDatetime: new Date().toISOString(),
              featured: false,
              draft: false,
              tags: '',
              source: '',
              sourceUrl: '',
              order: '',
              content: ''
            });
          }
          
          // Call refresh callback if provided
          if (onRefresh) {
            onRefresh();
          }
        } else {
          throw new Error(result.error || 'Failed to create snip');
        }
      }
      
      setFormMessage({ type: 'success', text: editMode ? 'Snip updated successfully!' : 'Snip created successfully!' });
      
    } catch (error) {
      console.error(editMode ? 'Error updating snip:' : 'Error creating snip:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      onError(errorMessage);
      setFormMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine button text based on current state
  const buttonText = isTokenValidating ? 'Validating Token...' : 
                    isSubmitting ? (editMode ? 'Updating...' : 'Creating...') : 
                    (editMode ? 'Update Snip' : 'Create Snip');

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">{editMode ? 'Edit Snip' : 'Create New Snip'}</h2>
      
      {formMessage && (
        <div className={`mb-4 p-3 rounded-md ${
          formMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' 
          : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {formMessage.text}
        </div>
      )}
      
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
              {/* Added safety check with fallback to empty array */}
              {(albums || []).map(album => (
                <option key={album.id} value={album.id}>
                  {album.data?.title || album.title || album.id}
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
              value={formData.pubDatetime.split('T')[0]} // Show only YYYY-MM-DD in input
              onChange={(e) => {
                // Preserve time portion of the ISO string when updating date
                const newDate = new Date(`${e.target.value}T00:00:00.000Z`);
                setFormData({
                  ...formData,
                  pubDatetime: newDate.toISOString()
                });
              }}
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
        
        <div className="pt-4 flex justify-between">
          {/* Show cancel button in edit mode */}
          {editMode && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
            >
              Cancel
            </button>
          )}
          
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

export default SnipForm;
