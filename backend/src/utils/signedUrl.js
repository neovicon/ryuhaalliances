import { supabase, STORAGE_BUCKET } from '../config/supabase.js';

/**
 * Generate a signed URL for a file in Supabase Storage
 * @param {string} filePath - The file path (filename or path within bucket)
 * @param {number} expiresIn - URL expiration time in seconds (default: 60)
 * @returns {Promise<string|null>} - Signed URL or null if Supabase not configured or file not found
 */
export async function getSignedUrl(filePath, expiresIn = 60) {
  if (!filePath) return null;
  
  // If it's already a full URL (legacy or external), return as-is
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  
  // If Supabase is not configured, return local file URL
  if (!supabase) {
    // Local file path - convert to full URL
    const path = filePath.startsWith('/') ? filePath : `/${filePath}`;
    const baseUrl = process.env.BACKEND_URL || 
                    process.env.API_URL?.replace('/api', '') || 
                    'http://localhost:5000';
    return `${baseUrl}${path}`;
  }

  try {
    // Extract just the filename if path includes directory
    // Supabase storage paths are relative to the bucket root
    const fileName = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    
    // Generate signed URL for private bucket
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(fileName, expiresIn);

    if (error) {
      console.error('Error generating signed URL:', error);
      // Fallback to local URL if file might be local
      if (filePath.startsWith('/uploads/')) {
        const baseUrl = process.env.BACKEND_URL || 
                        process.env.API_URL?.replace('/api', '') || 
                        'http://localhost:5000';
        return `${baseUrl}${filePath}`;
      }
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return null;
  }
}

