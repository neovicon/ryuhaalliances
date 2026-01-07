import { Router } from 'express';
import { requireAuth, requireAesther, optionalAuth } from '../middleware/auth.js';
import { createEvent, listEvents, updateEvent, deleteEvent, getEventById, addComment, validateCreateEvent, validateUpdateEvent, validateDeleteEvent, validateAddComment, validateGetEvent } from '../controllers/event.controller.js';
import { uploadImage, uploadToStorage } from '../middleware/upload.js';
import multer from 'multer';

const router = Router();

// Error handler for multer file size errors
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File is too large, only 30MB is accepted' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

router.get('/', optionalAuth, listEvents);
// This route must come after other specific routes but before POST/PUT/DELETE
router.get('/:id', optionalAuth, validateGetEvent, getEventById);
router.post('/', requireAuth, requireAesther, uploadImage.single('image'), handleMulterError, uploadToStorage, async (req, res, next) => {
  // Add imageUrl to req.body if file was uploaded (store only filename/path, not full URL)
  if (req.file) {
    // Use storagePath from Supabase (filename only), otherwise fall back to local path
    req.body.imageUrl = req.file.storagePath || `/uploads/${req.file.filename}`;
  }
  next();
}, validateCreateEvent, createEvent);
router.put('/:id', requireAuth, requireAesther, uploadImage.single('image'), handleMulterError, uploadToStorage, async (req, res, next) => {
  // Add imageUrl to req.body if file was uploaded (store only filename/path, not full URL)
  if (req.file) {
    // Use storagePath from Supabase (filename only), otherwise fall back to local path
    req.body.imageUrl = req.file.storagePath || `/uploads/${req.file.filename}`;
  }
  next();
}, validateUpdateEvent, updateEvent);
router.delete('/:id', requireAuth, requireAesther, validateDeleteEvent, deleteEvent);
router.post('/:id/comments', requireAuth, validateAddComment, addComment);

export default router;

