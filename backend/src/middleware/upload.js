import multer from 'multer';
import path from 'path';
import { nanoid } from 'nanoid';
import blobServiceClient from "../config/azure.js";
import { getUploadPath } from "../utils/storageHelper.js";

const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "uploads";

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

/**
 * Upload file to Azure Storage
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} filename - Filename
 * @param {string} mimetype - MIME type
 * @returns {Promise<string>} - File key to store in database
 */
export async function uploadToAzure(fileBuffer, filename, mimetype) {
  try {
    const blobName = getUploadPath(filename);

    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Ensure container exists
    await containerClient.createIfNotExists({
      access: 'blob'
    });

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(fileBuffer, {
      blobHTTPHeaders: {
        blobContentType: mimetype
      }
    });

    // Return the key to store in database
    return blobName;
  } catch (error) {
    console.error('Error uploading to Azure:', error);
    // Fallback to local storage if upload fails
    const fs = await import('fs');
    const { writeFile, mkdir } = fs.promises;
    // Ensure uploads directory exists
    try {
      await mkdir('src/uploads', { recursive: true });
    } catch (mkdirError) {
      // Directory might already exist, ignore error
    }
    const localPath = `src/uploads/${filename}`;
    await writeFile(localPath, fileBuffer);
    return `/uploads/${filename}`;
  }
}

// Alias for backward compatibility
export const uploadToB2 = uploadToAzure;
export const uploadToSupabase = uploadToAzure;

/**
 * Middleware to upload file to B2 after multer processes it
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



