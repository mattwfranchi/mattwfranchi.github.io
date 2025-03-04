import React, { useState, useEffect } from 'react';
import { fileToBase64, uploadImage, generateContentFile, commitFile } from '../../utils/githubService';

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
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    // Clean up preview URL when component unmounts
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, []);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Create preview
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      onError('Please select an image file');
      return;
    }
    
    if (!formData.albumId) {
      onError('Please select an album');
      return;
    }
    
    setIsSubmitting(true);

    try {
      const token = gitHubToken;
      
      // Ensure we have a valid date in ISO format
      const photoData = {
        ...formData,
        pubDatetime: formData.pubDatetime || new Date().toISOString(),
      };
      
      // Upload image and process
      const base64Image = await fileToBase64(file);
      
      const uploadResult = await uploadImage(token, {
        filename: file.name,
        content: base64Image,
        albumId: formData.albumId
      });
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.message || 'Failed to upload image');
      }
      
      // Create the markdown content file with the proper date
      const contentFileData = {
        ...photoData,
        photoPath: uploadResult.path
      };
      
      const contentFile = generateContentFile('photos', contentFileData);
      
      const contentResult = await commitFile(token, contentFile);
      
      if (!contentResult.success) {
        throw new Error(contentResult.message || 'Failed to create photo content');
      }
      
      onSuccess('Photo uploaded successfully!');
      
      // Reset form
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
        pubDatetime: new Date().toISOString() // Use full ISO format
      });
      setFile(null);
      setPreview(null);
    } catch (error) {
      console.error('Error uploading photo:', error);
      onError((error as Error).message || 'Failed to upload photo');
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Photo*
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {preview && (
              <div className="mt-2">
                <img src={preview} alt="Preview" className="max-h-64 rounded-md" />
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
            disabled={isSubmitting}
            className={`px-4 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? 'Uploading...' : 'Upload Photo'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PhotoForm;