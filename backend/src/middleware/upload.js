import multer from 'multer';
import path from 'path';
import { nanoid } from 'nanoid';
import { uploadToAzure } from "../utils/azureUploader.js";

// Use memory storage to get file buffer for Azure upload
const storage = multer.memoryStorage();

function fileFilter(_req, file, cb) {
  const allowed = ['image/png', 'image/jpeg', 'image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true); else cb(new Error('Invalid file type'));
}

export const uploadImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 30 * 1024 * 1024 } // 30MB limit
});

// Re-export uploadToAzure for backward compatibility if needed, 
// though it's better to import from utils/azureUploader.js directly in new code.
export { uploadToAzure };

// Alias for backward compatibility
export const uploadToB2 = uploadToAzure;
export const uploadToSupabase = uploadToAzure;

/**
 * Middleware to upload file to Azure after multer processes it
 */
export function uploadToStorage(req, res, next) {
  if (!req.file) {
    return next();
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  // Use originalname part to keep some context if needed, or just random
  // The previous implementation used nanoid, let's keep it similar but maybe include original name sanitized?
  // User requirement: "Automatically prefixes every uploaded file with the upload folder (uploads/filename)"
  // getUploadPath handles the prefix. We just need a unique filename.
  const filename = `${nanoid(10)}${ext}`;

  uploadToAzure(req.file.buffer, filename, req.file.mimetype)
    .then(fileKey => {
      // Store the file key
      req.file.storagePath = fileKey;
      req.file.filename = filename;
      // Also set key for consistency with my new controller
      req.file.key = fileKey;
      next();
    })
    .catch(error => {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Failed to upload file' });
    });
}



