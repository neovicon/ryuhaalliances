import { Router } from 'express';
import { requireAuth, requireModerator } from '../middleware/auth.js';
import { createEvent, listEvents, updateEvent, deleteEvent, validateCreateEvent, validateUpdateEvent, validateDeleteEvent } from '../controllers/event.controller.js';
import { uploadImage } from '../middleware/upload.js';

const router = Router();

router.get('/', listEvents);
router.post('/', requireAuth, requireModerator, uploadImage.single('image'), async (req, res, next) => {
  // Add imageUrl to req.body if file was uploaded
  if (req.file) {
    req.body.imageUrl = `/uploads/${req.file.filename}`;
  }
  next();
}, validateCreateEvent, createEvent);
router.put('/:id', requireAuth, requireModerator, uploadImage.single('image'), async (req, res, next) => {
  // Add imageUrl to req.body if file was uploaded
  if (req.file) {
    req.body.imageUrl = `/uploads/${req.file.filename}`;
  }
  next();
}, validateUpdateEvent, updateEvent);
router.delete('/:id', requireAuth, requireModerator, validateDeleteEvent, deleteEvent);

export default router;

