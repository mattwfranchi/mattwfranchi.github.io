/**
 * Client-side image processing utility
 */

export async function optimizeImage(file: File): Promise<File> {
  // Check if the browser supports the required APIs
  if (!('createImageBitmap' in window) || !('OffscreenCanvas' in window)) {
    console.warn('Browser does not support client-side image optimization');
    return file;
  }

  try {
    // Create an image bitmap from the file
    const imageBitmap = await createImageBitmap(file);
    
    // Target dimensions - adjust based on your needs
    const maxWidth = 1600;
    const maxHeight = 1600;
    
    // Calculate new dimensions while preserving aspect ratio
    let width = imageBitmap.width;
    let height = imageBitmap.height;
    
    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }
    
    // Create an offscreen canvas
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not get 2D context for canvas');
    }
    
    // Draw and resize the image
    ctx.drawImage(imageBitmap, 0, 0, width, height);
    
    // Convert to blob with quality setting (0.8 = 80% quality)
    const blob = await canvas.convertToBlob({ 
      type: 'image/jpeg',
      quality: 0.8
    });
    
    // Create a new file from the blob
    return new File([blob], file.name, {
      type: 'image/jpeg',
      lastModified: Date.now()
    });
  } catch (error) {
    console.error('Image optimization failed:', error);
    // Return original file as fallback
    return file;
  }
}