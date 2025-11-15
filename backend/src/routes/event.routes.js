import { Router } from 'express';
import { requireAuth, requireModerator } from '../middleware/auth.js';
import { createEvent, listEvents, updateEvent, deleteEvent, getEventById, addComment, validateCreateEvent, validateUpdateEvent, validateDeleteEvent, validateAddComment, validateGetEvent } from '../controllers/event.controller.js';
import { uploadImage, uploadToStorage } from '../middleware/upload.js';

const router = Router();

router.get('/', listEvents);
// This route must come after other specific routes but before POST/PUT/DELETE
router.get('/:id', validateGetEvent, getEventById);
router.post('/', requireAuth, requireModerator, uploadImage.single('image'), uploadToStorage, async (req, res, next) => {
  // Add imageUrl to req.body if file was uploaded (store only filename/path, not full URL)
  if (req.file) {
    // Use storagePath from Supabase (filename only), otherwise fall back to local path
    req.body.imageUrl = req.file.storagePath || `/uploads/${req.file.filename}`;
  }
  next();
}, validateCreateEvent, createEvent);
router.put('/:id', requireAuth, requireModerator, uploadImage.single('image'), uploadToStorage, async (req, res, next) => {
  // Add imageUrl to req.body if file was uploaded (store only filename/path, not full URL)
  if (req.file) {
    // Use storagePath from Supabase (filename only), otherwise fall back to local path
    req.body.imageUrl = req.file.storagePath || `/uploads/${req.file.filename}`;
  }
  next();
}, validateUpdateEvent, updateEvent);
router.delete('/:id', requireAuth, requireModerator, validateDeleteEvent, deleteEvent);
router.post('/:id/comments', requireAuth, validateAddComment, addComment);

export default router;

