import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { createAnnouncement, listAnnouncements, updateAnnouncement, deleteAnnouncement, getAnnouncementById, addComment, validateCreateAnnouncement, validateUpdateAnnouncement, validateDeleteAnnouncement, validateGetAnnouncement, validateAddComment } from '../controllers/announcement.controller.js';
import { uploadImage, uploadToStorage } from '../middleware/upload.js';

const router = Router();

router.get('/', listAnnouncements);
router.get('/:id', validateGetAnnouncement, getAnnouncementById);
router.post('/:id/comments', requireAuth, validateAddComment, addComment);
router.post('/', requireAuth, requireAdmin, uploadImage.single('image'), uploadToStorage, async (req, res, next) => {
  // Add imageUrl to req.body if file was uploaded (store only filename/path, not full URL)
  if (req.file) {
    // Use storagePath from Supabase (filename only), otherwise fall back to local path
    req.body.imageUrl = req.file.storagePath || `/uploads/${req.file.filename}`;
  }
  next();
}, validateCreateAnnouncement, createAnnouncement);
router.put('/:id', requireAuth, requireAdmin, uploadImage.single('image'), uploadToStorage, async (req, res, next) => {
  // Add imageUrl to req.body if file was uploaded (store only filename/path, not full URL)
  if (req.file) {
    // Use storagePath from Supabase (filename only), otherwise fall back to local path
    req.body.imageUrl = req.file.storagePath || `/uploads/${req.file.filename}`;
  }
  next();
}, validateUpdateAnnouncement, updateAnnouncement);
router.delete('/:id', requireAuth, requireAdmin, validateDeleteAnnouncement, deleteAnnouncement);

export default router;

