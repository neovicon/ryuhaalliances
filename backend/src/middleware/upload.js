import multer from 'multer';
import path from 'path';
import { nanoid } from 'nanoid';
import { supabase, STORAGE_BUCKET } from '../config/supabase.js';

// Use memory storage to get file buffer for Supabase upload
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
 * Upload file to Supabase Storage
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} filename - Filename
 * @param {string} mimetype - MIME type
 * @returns {Promise<string>} - File path (not URL) to store in database
 */
export async function uploadToSupabase(fileBuffer, filename, mimetype) {
  // If Supabase is not configured, fall back to local storage
  if (!supabase) {
    const fs = await import('fs');
    const { writeFile, mkdir } = fs.promises;
    // Ensure uploads directory exists
    try {
      await mkdir('src/uploads', { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }
    const localPath = `src/uploads/${filename}`;
    await writeFile(localPath, fileBuffer);
    return `/uploads/${filename}`;
  }

  try {
    // Upload to Supabase Storage (private bucket)
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filename, fileBuffer, {
        contentType: mimetype,
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }

    // Return only the path (filename) to store in database
    // Signed URLs will be generated on-demand
    return filename;
  } catch (error) {
    console.error('Error uploading to Supabase:', error);
    // Fallback to local storage if Supabase upload fails
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

/**
 * Middleware to upload file to Supabase after multer processes it
 */
export function uploadToStorage(req, res, next) {
  if (!req.file) {
    return next();
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  const filename = `${Date.now()}-${nanoid(8)}${ext}`;

  uploadToSupabase(req.file.buffer, filename, req.file.mimetype)
    .then(filePath => {
      // Store the file path (not full URL) - signed URLs will be generated on-demand
      req.file.storagePath = filePath;
      req.file.filename = filename;
      next();
    })
    .catch(error => {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Failed to upload file' });
    });
}


