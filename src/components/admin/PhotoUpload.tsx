import React, { useState } from 'react';
import { uploadImage } from '../../utils/githubDirectService';

interface PhotoUploadProps {
  albumId: string;
  githubToken: string;
  onSuccess: (imageUrl: string) => void;
  onError: (message: string) => void;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ 
  albumId, 
  githubToken, 
  onSuccess, 
  onError 
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploading(true);
    setProgress(10);
    
    try {
      const file = files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        onError('File must be an image');
        setUploading(false);
        return;
      }
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);
      
      // Upload the image
      const result = await uploadImage(file, albumId, githubToken);
      
      clearInterval(progressInterval);
      
      if (result.success && result.url) {
        setProgress(100);
        onSuccess(result.url);
      } else {
        onError(result.error || 'Failed to upload image');
      }
    } catch (error) {
      onError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="mt-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Upload Photo
      </label>
      
      <input
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        disabled={uploading}
        className="block w-full text-sm text-slate-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-md file:border-0
          file:text-sm file:font-semibold
          file:bg-indigo-50 file:text-indigo-700
          hover:file:bg-indigo-100"
      />
      
      {uploading && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {progress < 100 ? 'Uploading and optimizing...' : 'Upload complete!'}
          </p>
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;