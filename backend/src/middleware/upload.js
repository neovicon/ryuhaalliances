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

// Media upload (images and videos)
function mediaFileFilter(_req, file, cb) {
  const allowedImages = ['image/png', 'image/jpeg', 'image/webp'];
  const allowedVideos = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
  const allowed = [...allowedImages, ...allowedVideos];
  if (allowed.includes(file.mimetype)) cb(null, true); else cb(new Error('Invalid file type'));
}

export const uploadMedia = multer({
  storage,
  fileFilter: mediaFileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit for videos
});

// Re-export uploadToAzure for backward compatibility if needed, 
// though it's better to import from utils/azureUploader.js directly in new code.
export { uploadToAzure };

// Alias for backward compatibility
export const uploadToB2 = uploadToAzure;
export const uploadToSupabase = uploadToAzure;

/**
 * Middleware to upload file(s) to Azure after multer processes them
 */
export function uploadToStorage(req, res, next) {
  // Handle single file upload (req.file)
  if (req.file) {
    const ext = path.extname(req.file.originalname).toLowerCase();
    const filename = `${nanoid(10)}${ext}`;

    uploadToAzure(req.file.buffer, filename, req.file.mimetype)
      .then(fileKey => {
        req.file.storagePath = fileKey;
        req.file.filename = filename;
        req.file.key = fileKey;
        next();
      })
      .catch(error => {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload file' });
      });
    return;
  }

  // Handle multiple file fields (req.files)
  if (req.files) {
    const uploadPromises = [];
    const fileFields = Object.keys(req.files);

    fileFields.forEach(fieldName => {
      const filesArray = req.files[fieldName];
      filesArray.forEach(file => {
        const ext = path.extname(file.originalname).toLowerCase();
        const filename = `${nanoid(10)}${ext}`;

        const uploadPromise = uploadToAzure(file.buffer, filename, file.mimetype)
          .then(fileKey => {
            file.storagePath = fileKey;
            file.filename = filename;
            file.key = fileKey;
          });

        uploadPromises.push(uploadPromise);
      });
    });

    Promise.all(uploadPromises)
      .then(() => next())
      .catch(error => {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload files' });
      });
    return;
  }

  // No files to upload
  next();
}



