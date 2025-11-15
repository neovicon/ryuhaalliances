import { getSignedUrl } from './signedUrl.js';

/**
 * Converts a photoUrl path to a full URL (signed URL for Supabase, or local URL)
 * @param {string} photoUrl - The photoUrl from the database (can be relative path, absolute URL, or Supabase filename)
 * @param {object} req - Optional Express request object to get the server URL dynamically
 * @param {number} expiresIn - Expiration time in seconds for signed URLs (default: 3600 = 1 hour)
 * @returns {Promise<string|null>} - The full URL or null if photoUrl is not provided
 */
export async function getPhotoUrl(photoUrl, req = null, expiresIn = 3600) {
  if (!photoUrl) return null;
  
  // If it's already a full URL, return it as is
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
    return photoUrl;
  }
  
  // Use signed URL generator (handles both Supabase and local files)
  return await getSignedUrl(photoUrl, expiresIn);
}

/**
 * Helper to process user object and add signed URLs for photo and heroCard
 * @param {object} userObj - User object from database
 * @param {object} req - Optional Express request object
 * @param {number} expiresIn - Expiration time in seconds for signed URLs
 * @returns {Promise<object>} - User object with signed URLs
 */
export async function processUserUrls(userObj, req = null, expiresIn = 3600) {
  if (!userObj) return userObj;
  
  const processed = { ...userObj };
  if (userObj.photoUrl) {
    processed.photoUrl = await getPhotoUrl(userObj.photoUrl, req, expiresIn);
  }
  if (userObj.heroCardUrl) {
    processed.heroCardUrl = await getPhotoUrl(userObj.heroCardUrl, req, expiresIn);
  }
  return processed;
}

/**
 * Helper to process array of user objects and add signed URLs
 * @param {Array} users - Array of user objects
 * @param {object} req - Optional Express request object
 * @param {number} expiresIn - Expiration time in seconds for signed URLs
 * @returns {Promise<Array>} - Array of user objects with signed URLs
 */
export async function processUsersUrls(users, req = null, expiresIn = 3600) {
  if (!Array.isArray(users)) return users;
  return Promise.all(users.map(user => processUserUrls(user, req, expiresIn)));
}

/**
 * Synchronous version for backward compatibility (returns placeholder, should use async version)
 * @deprecated Use getPhotoUrl() async version instead
 */
export function getPhotoUrlSync(photoUrl, req = null) {
  if (!photoUrl) return null;
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
    return photoUrl;
  }
  
  // For sync version, return local URL (signed URLs require async)
  let baseUrl;
  if (req) {
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:5000';
    baseUrl = `${protocol}://${host}`;
  } else {
    baseUrl = process.env.BACKEND_URL || 
              process.env.API_URL?.replace('/api', '') || 
              'http://localhost:5000';
  }
  
  const path = photoUrl.startsWith('/') ? photoUrl : `/${photoUrl}`;
  return `${baseUrl}${path}`;
}

