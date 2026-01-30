// 100% FREE IMAGE SOLUTION - No Firebase Storage Required
// Uses base64 encoding for immediate, permanent image storage in Firestore

export const uploadImageToFirebaseStorage = async (file: File, folder: 'products' | 'turbo' | 'cars' = 'products'): Promise<string> => {
  try {
    // Validate file first
    const validation = validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid file');
    }

    console.log('✅ File validation passed:', file.name, file.type, `${(file.size / 1024 / 1024).toFixed(2)}MB`);

    // Compress image for better performance and storage efficiency
    const compressedFile = await compressImage(file, 1200, 0.85);
    
    // Convert to base64 - this works immediately and stores permanently in Firestore
    // No external storage needed - completely free solution!
    const base64 = await convertToBase64(compressedFile);
    
    console.log('✅ Image processed successfully as base64 - ready for free Firestore storage');
    return base64;
    
  } catch (error) {
    console.error('❌ Image upload failed:', error);
    // More specific error messages
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Failed to process image. Please try a different image file.');
  }
};

// Delete function (no-op for base64 images stored in Firestore)
export const deleteImageFromFirebaseStorage = async (imageUrl: string): Promise<void> => {
  // Base64 images stored in Firestore don't need separate deletion
  // They're deleted automatically when the product document is deleted
  console.log('Base64 image stored in Firestore - no separate deletion needed');
};

export const convertToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const result = e.target?.result as string;
          if (result && result.startsWith('data:image/')) {
            console.log('✅ Base64 conversion successful');
            resolve(result);
          } else {
            throw new Error('Invalid base64 result');
          }
        } catch (error) {
          console.error('❌ Base64 processing error:', error);
          reject(new Error('Failed to process image data'));
        }
      };
      
      reader.onerror = (error) => {
        console.error('❌ FileReader error:', error);
        reject(new Error('Failed to read image file. Please try a different image.'));
      };
      
      reader.onabort = () => {
        console.error('❌ FileReader aborted');
        reject(new Error('Image processing was cancelled. Please try again.'));
      };
      
      // Start reading the file
      reader.readAsDataURL(file);
      
    } catch (error) {
      console.error('❌ Base64 conversion setup error:', error);
      reject(new Error('Failed to start image processing. Please try again.'));
    }
  });
};

export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }
  
  // More flexible file type checking
  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();
  
  // Check by file extension and MIME type
  const supportedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'];
  const supportedMimeTypes = [
    'image/jpeg', 
    'image/jpg', 
    'image/png', 
    'image/webp', 
    'image/gif',
    'image/bmp',
    'image/x-png',
    'image/pjpeg'
  ];
  
  const hasValidExtension = supportedExtensions.some(ext => fileName.endsWith(ext));
  const hasValidMimeType = supportedMimeTypes.includes(fileType) || fileType.startsWith('image/');
  
  if (!hasValidExtension && !hasValidMimeType) {
    return { valid: false, error: 'Please select a valid image file (JPG, PNG, WebP, GIF)' };
  }
  
  // Increased file size limit
  if (file.size > 50 * 1024 * 1024) { // 50MB limit
    return { valid: false, error: 'Image size should be less than 50MB' };
  }
  
  return { valid: true };
};

export const compressImage = (file: File, maxWidth: number = 1200, quality: number = 0.85): Promise<File> => {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        try {
          // Calculate new dimensions maintaining aspect ratio
          let { width, height } = img;
          
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxWidth) {
              width = (width * maxWidth) / height;
              height = maxWidth;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress with high quality
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              
              // Log compression results
              const originalSizeMB = (file.size / (1024 * 1024)).toFixed(2);
              const compressedSizeMB = (compressedFile.size / (1024 * 1024)).toFixed(2);
              console.log(`✅ Image compressed: ${originalSizeMB}MB → ${compressedSizeMB}MB`);
              
              resolve(compressedFile);
            } else {
              console.log('⚠️ Compression failed, using original file');
              resolve(file);
            }
          }, file.type, quality);
        } catch (error) {
          console.error('⚠️ Image compression error:', error);
          resolve(file);
        }
      };
      
      img.onerror = () => {
        console.error('⚠️ Image loading failed during compression, using original file');
        resolve(file);
      };
      
      img.src = URL.createObjectURL(file);
    } catch (error) {
      console.error('⚠️ Compression setup failed, using original file:', error);
      resolve(file);
    }
  });
};

// Get safe image URL with proper fallbacks
export const getSafeImageUrl = (url: string | undefined, type: 'turbo' | 'car' = 'turbo'): string => {
  if (!url) {
    return type === 'turbo' 
      ? 'https://via.placeholder.com/400x400/3B82F6/FFFFFF?text=Turbo+Image'
      : 'https://via.placeholder.com/400x400/10B981/FFFFFF?text=Car+Image';
  }
  
  // Return base64 data URLs as-is (they work perfectly)
  if (url.startsWith('data:image/')) {
    return url;
  }
  
  // Return Firebase Storage URLs as-is (if they exist)
  if (url.includes('firebasestorage.googleapis.com')) {
    return url;
  }
  
  // Handle problematic URLs
  if (url.startsWith('/placeholder') || 
      url.includes('google.com/imgres') || 
      url.includes('googleusercontent.com') ||
      url.includes('tmpfiles.org') ||
      url.includes('imgbb.com')) {
    return type === 'turbo' 
      ? 'https://via.placeholder.com/400x400/3B82F6/FFFFFF?text=Turbo+Image'
      : 'https://via.placeholder.com/400x400/10B981/FFFFFF?text=Car+Image';
  }
  
  // Return other URLs as-is
  return url;
};

// Legacy function for backward compatibility
export const uploadImageToImgBB = uploadImageToFirebaseStorage;