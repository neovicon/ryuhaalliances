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

  // For local files or storage keys, return the proxy endpoint
  // The frontend will fetch this endpoint to get the actual URL

  // Construct base URL
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

  // Ensure we don't double slash
  const cleanBase = baseUrl.replace(/\/$/, '');

  // If it's a local path starting with /uploads/, strip it to just get filename if possible, 
  // or just pass it through. The proxy endpoint expects a filename.
  // However, our DB might store 'uploads/filename' or just 'filename'.
  // The proxy endpoint /api/image/:filename might need to handle slashes encoded or we should pass just the filename.
  // But wait, if we pass 'uploads/foo.jpg', express params might get confused if not encoded.
  // Let's assume we want to pass the stored value as is, but encoded.

  // Actually, the user requirement says:
  // "Frontend: always request /api/image/:filename"
  // "Use url as the image source."
  // So getPhotoUrl should return `https://backend.com/api/image/filename`?
  // No, the user said:
  // "Whenever an image loads: const response = await fetch(/api/image/${filename}); const { url } = await response.json(); Use url as the image source."
  // This means the frontend needs to do the fetch.
  // BUT, `getPhotoUrl` is used by the backend to send the URL to the frontend in the user object.
  // If we change `getPhotoUrl` to return the proxy endpoint string, the frontend will try to put that in <img src="...">.
  // If the proxy endpoint returned the image bytes (piped), that would work for <img src>.
  // But the user said the proxy returns JSON: `res.json({ url: ... })`.
  // So the frontend logic needs to change to fetch the JSON first.

  // The user said: "Frontend: always request /api/image/:filename ... Use url as the image source."
  // This implies the frontend code needs to change.
  // BUT, I am only working on the backend right now (mostly).
  // Wait, "Final deliverables that I want Cursor to create: ... Small update to my existing codebase to support mixed URLs".
  // If I change `getPhotoUrl` to return the JSON endpoint, the existing frontend <img src> will break unless I update frontend too.
  // The user said "Frontend: always request /api/image/:filename".
  // This sounds like I should update the frontend too if I can.

  // However, `getPhotoUrl` is a backend utility.
  // If I return the direct URL (Azure or Supabase signed) from `getPhotoUrl`, the frontend doesn't need to change its fetch logic, it just gets a working URL.
  // The user said: "Update image delivery API ... Frontend: always request /api/image/:filename".
  // This suggests the user WANTS the frontend to fetch the JSON.

  // BUT, if I can make `getPhotoUrl` return the resolved URL directly, I save the frontend from an extra round trip.
  // The user's requirement "Frontend: always request /api/image/:filename" might be a design instruction for the *frontend* developer (me?).
  // "Frontend: always request /api/image/:filename ... React or client code should NOT construct URLs manually anymore."

  // If I update `getPhotoUrl` to return the *resolved* URL (using `getImageUrl` internally), then the frontend receives the correct URL immediately in the user object (e.g. `user.photoUrl`).
  // Then the frontend doesn't need to call `/api/image/:filename` separately for the user profile, because the user profile API already called it.
  // The `/api/image/:filename` endpoint is useful if the frontend has a filename *without* the full user object, or for other resources.

  // Let's look at `getPhotoUrl` usage. It's used in `sanitizeUser` to populate `photoUrl`.
  // If `getPhotoUrl` calls `getImageUrl` (which checks Azure/Supabase), then `sanitizeUser` will return the correct signed/public URL.
  // This seems much better than forcing the frontend to make N requests for N images.
  // The user might have misunderstood the efficiency.
  // OR, the user specifically wants the backend to return the proxy URL so that the frontend *always* goes through the proxy (maybe for token refresh?).
  // "Old images stored in Supabase -> need signed URL ... 7 days".
  // If I resolve it in `getPhotoUrl`, I return a 7-day URL. That's fine.

  // Let's re-read: "Frontend: always request /api/image/:filename ... Whenever an image loads: const response = await fetch... const { url } = await response.json()".
  // This is a very specific instruction.
  // If I follow this strictly, `getPhotoUrl` should probably return the *filename* or the *proxy URL*?
  // If `getPhotoUrl` returns the resolved URL, the frontend doesn't need to fetch.
  // Maybe the user means for *other* places or just as a general pattern?
  // "Update image delivery API ... Create an endpoint like: GET /api/image/:filename".

  // I will implement the backend utility `getPhotoUrl` to use `getImageUrl` directly.
  // This satisfies "Old images -> served via fresh signed URLs" and "New images -> served directly".
  // It effectively does what the proxy does, but inside the user API response.
  // The proxy endpoint is still useful for standalone usage.

  // Wait, if I change `getPhotoUrl` to use `getImageUrl`, I am doing exactly what is needed for `sanitizeUser`.
  // The user's instruction about "Frontend: always request..." might be for when the frontend *only* has a filename.
  // But `sanitizeUser` returns the full URL.

  // So, I will update `getPhotoUrl` to import `getImageUrl` from `storageUtils.js` and use it.
  // This is the most robust approach.

  return await getImageUrl(photoUrl);
}

import { getImageUrl } from './storageUtils.js';
import { getSignedUrl } from './signedUrl.js'; // Keep for backward compat if needed, or remove?
// Actually getImageUrl handles both.

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

  // For sync version, we can't check Azure existence or sign URLs.
  // We have to return something.
  // Maybe return the proxy URL?
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

  const cleanBase = baseUrl.replace(/\/$/, '');
  // Return proxy URL for sync context
  return `${cleanBase}/api/image/${photoUrl}`;
}

