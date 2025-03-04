import React, { useState, useEffect } from 'react';
import { createContent } from '../../utils/githubDirectService';
import PhotoUpload from './PhotoUpload';

interface PhotoFormProps {
  albums: any[];
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  gitHubToken: string;
}

const PhotoForm: React.FC<PhotoFormProps> = ({ albums, onSuccess, onError, gitHubToken }) => {
  const [formData, setFormData] = useState({
    albumId: '',
    title: '',
    caption: '',
    order: '',
    metadata: {
      camera: '',
      lens: '',
      settings: {
        aperture: '',
        shutterSpeed: '',
        iso: '',
        focalLength: ''
      }
    },
    pubDatetime: new Date().toISOString() // Use full ISO format
  });
  
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      if (child.includes('.')) {
        const [nestedParent, nestedChild] = child.split('.');
        setFormData({
          ...formData,
          [parent]: {
            ...formData[parent as keyof typeof formData],
            [nestedParent]: {
              ...(formData[parent as keyof typeof formData] as any)[nestedParent],
              [nestedChild]: value
            }
          }
        });
      } else {
        setFormData({
          ...formData,
          [parent]: {
            ...formData[parent as keyof typeof formData],
            [child]: value
          }
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Handle successful image upload
  const handleImageUploadSuccess = (url: string) => {
    setImageUrl(url);
    // Extract filename from URL for visual feedback
    const filename = url.split('/').pop() || 'uploaded-image';
    onSuccess(`Image "${filename}" uploaded successfully`);
    
    // If we have a title field that's empty, use the filename as title suggestion
    if (!formData.title) {
      const suggestedTitle = filename.split('.')[0]
        .replace(/-/g, ' ')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
      
      setFormData(prev => ({
        ...prev,
        title: suggestedTitle
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageUrl) {
      onError('Please upload an image first');
      return;
    }
    
    if (!formData.albumId) {
      onError('Please select an album');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Generate a unique ID for the photo
      const photoId = `photo_${Date.now()}`;
      
      // Prepare data for submission
      const photoData = {
        id: photoId,
        albumId: formData.albumId,
        title: formData.title,
        caption: formData.caption,
        order: formData.order ? parseInt(formData.order) : undefined,
        metadata: {
          camera: formData.metadata.camera,
          lens: formData.metadata.lens,
          settings: {
            aperture: formData.metadata.settings.aperture,
            shutterSpeed: formData.metadata.settings.shutterSpeed,
            iso: formData.metadata.settings.iso,
            focalLength: formData.metadata.settings.focalLength
          }
        },
        pubDatetime: formData.pubDatetime || new Date().toISOString(),
        photo: imageUrl // Use the uploaded image URL
      };
      
      // Create content file using our direct GitHub service
      const result = await createContent('photos', photoData, gitHubToken);
      
      if (result.success) {
        onSuccess('Photo added successfully');
        
        // Reset the form
        setFormData({
          albumId: '',
          title: '',
          caption: '',
          order: '',
          metadata: {
            camera: '',
            lens: '',
            settings: {
              aperture: '',
              shutterSpeed: '',
              iso: '',
              focalLength: ''
            }
          },
          pubDatetime: new Date().toISOString()
        });
        setImageUrl(null);
      } else {
        onError(result.error || 'Failed to create photo content');
      }
    } catch (error) {
      onError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Upload New Photo</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Album*
            </label>
            <select
              name="albumId"
              value={formData.albumId}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select an album</option>
              {albums.map(album => (
                <option key={album.id} value={album.id}>
                  {album.data.title}
                </option>
              ))}
            </select>
          </div>
          
          <div className="md:col-span-2">
            {/* Use the reusable PhotoUpload component */}
            {formData.albumId ? (
              <>
                <PhotoUpload
                  albumId={formData.albumId}
                  githubToken={gitHubToken}
                  onSuccess={handleImageUploadSuccess}
                  onError={onError}
                />
                
                {imageUrl && (
                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Image uploaded successfully
                    </p>
                    <p className="text-xs text-green-700 mt-1 truncate">
                      {imageUrl}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="border border-yellow-200 bg-yellow-50 p-3 rounded-md">
                <p className="text-sm text-yellow-800">
                  Please select an album before uploading photos.
                </p>
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
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
              Caption
            </label>
            <textarea
              name="caption"
              value={formData.caption}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            ></textarea>
          </div>
          
          <div className="md:col-span-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-indigo-600 hover:text-indigo-800 flex items-center"
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ml-1 transform ${showAdvanced ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          {showAdvanced && (
            <>
              <div className="md:col-span-2 border-t pt-4 mt-2">
                <h3 className="text-lg font-medium mb-3">Photo Metadata</h3>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Camera
                </label>
                <input
                  type="text"
                  name="metadata.camera"
                  value={formData.metadata.camera}
                  onChange={handleChange}
                  placeholder="e.g. Canon EOS R5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lens
                </label>
                <input
                  type="text"
                  name="metadata.lens"
                  value={formData.metadata.lens}
                  onChange={handleChange}
                  placeholder="e.g. 24-70mm f/2.8"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Aperture
                </label>
                <input
                  type="text"
                  name="metadata.settings.aperture"
                  value={formData.metadata.settings.aperture}
                  onChange={handleChange}
                  placeholder="e.g. f/2.8"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shutter Speed
                </label>
                <input
                  type="text"
                  name="metadata.settings.shutterSpeed"
                  value={formData.metadata.settings.shutterSpeed}
                  onChange={handleChange}
                  placeholder="e.g. 1/250s"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ISO
                </label>
                <input
                  type="text"
                  name="metadata.settings.iso"
                  value={formData.metadata.settings.iso}
                  onChange={handleChange}
                  placeholder="e.g. 100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Focal Length
                </label>
                <input
                  type="text"
                  name="metadata.settings.focalLength"
                  value={formData.metadata.settings.focalLength}
                  onChange={handleChange}
                  placeholder="e.g. 35mm"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </>
          )}
        </div>
        
        <div className="pt-4">
          <button
            type="submit"
            disabled={!imageUrl || isSubmitting}
            className={`px-4 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${(!imageUrl || isSubmitting) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? 'Adding Photo...' : 'Save Photo'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PhotoForm;