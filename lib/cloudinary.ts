import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
}

export interface CloudinaryError {
  message: string;
  http_code: number;
}

/**
 * Upload image to Cloudinary
 */
export async function uploadToCloudinary(
  file: File,
  folder: string = 'menumaster'
): Promise<CloudinaryUploadResult> {
  try {
    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: folder,
      resource_type: 'image',
      transformation: [
        { width: 800, height: 600, crop: 'limit' },
        { quality: 'auto' },
        { format: 'auto' }
      ]
    });

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      resource_type: result.resource_type,
    };
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    throw new Error(error.message || 'Failed to upload image');
  }
}

/**
 * Delete image from Cloudinary
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error: any) {
    console.error('Cloudinary delete error:', error);
    throw new Error(error.message || 'Failed to delete image');
  }
}

/**
 * Extract public ID from Cloudinary URL
 */
export function extractPublicId(cloudinaryUrl: string): string {
  try {
    const urlParts = cloudinaryUrl.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    if (uploadIndex === -1) throw new Error('Invalid Cloudinary URL');
    
    const pathAfterUpload = urlParts.slice(uploadIndex + 2).join('/');
    const publicIdWithExtension = pathAfterUpload.split('.')[0];
    return publicIdWithExtension;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    throw new Error('Invalid Cloudinary URL format');
  }
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { isValid: false, error: 'Please select a valid image file' };
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return { isValid: false, error: 'Image size must be less than 5MB' };
  }

  // Check supported formats
  const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!supportedFormats.includes(file.type)) {
    return { isValid: false, error: 'Supported formats: JPEG, PNG, WebP' };
  }

  return { isValid: true };
}