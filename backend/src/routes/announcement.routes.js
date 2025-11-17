import { Router } from 'express';
import { requireAuth, requireAdmin, requireAestherOrVigilOrOverseer } from '../middleware/auth.js';
import { createAnnouncement, listAnnouncements, updateAnnouncement, deleteAnnouncement, getAnnouncementById, addComment, validateCreateAnnouncement, validateUpdateAnnouncement, validateDeleteAnnouncement, validateGetAnnouncement, validateAddComment } from '../controllers/announcement.controller.js';
import { uploadImage, uploadToStorage } from '../middleware/upload.js';

const router = Router();

router.get('/', listAnnouncements);
router.get('/:id', validateGetAnnouncement, getAnnouncementById);
router.post('/:id/comments', requireAuth, validateAddComment, addComment);
router.post('/', requireAuth, requireAestherOrVigilOrOverseer, uploadImage.single('image'), uploadToStorage, async (req, res, next) => {
  // Add imageUrl to req.body if file was uploaded (store only filename/path, not full URL)
  if (req.file) {
    // Use storagePath from Supabase (filename only), otherwise fall back to local path
    req.body.imageUrl = req.file.storagePath || `/uploads/${req.file.filename}`;
  }
  next();
}, validateCreateAnnouncement, createAnnouncement);
router.put('/:id', requireAuth, requireAestherOrVigilOrOverseer, uploadImage.single('image'), uploadToStorage, async (req, res, next) => {
  // Add imageUrl to req.body if file was uploaded (store only filename/path, not full URL)
  if (req.file) {
    // Use storagePath from Supabase (filename only), otherwise fall back to local path
    req.body.imageUrl = req.file.storagePath || `/uploads/${req.file.filename}`;
  }
  next();
}, validateUpdateAnnouncement, updateAnnouncement);
router.delete('/:id', requireAuth, requireAestherOrVigilOrOverseer, validateDeleteAnnouncement, deleteAnnouncement);

export default router;

