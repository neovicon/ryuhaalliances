/**
 * Converts a relative photoUrl path to a full URL
 * @param {string} photoUrl - The photoUrl from the database (can be relative or absolute)
 * @param {object} req - Optional Express request object to get the server URL dynamically
 * @returns {string|null} - The full URL or null if photoUrl is not provided
 */
export function getPhotoUrl(photoUrl, req = null) {
  if (!photoUrl) return null;
  // If it's already a full URL, return it as is
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
    return photoUrl;
  }
  
  // Try to get base URL from request object first (most accurate)
  let baseUrl;
  if (req) {
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:5000';
    baseUrl = `${protocol}://${host}`;
  } else {
    // Fallback to environment variables or default
    baseUrl = process.env.BACKEND_URL || 
              process.env.API_URL?.replace('/api', '') || 
              'http://localhost:5000';
  }
  
  // Ensure photoUrl starts with / if it's a relative path
  const path = photoUrl.startsWith('/') ? photoUrl : `/${photoUrl}`;
  return `${baseUrl}${path}`;
}

