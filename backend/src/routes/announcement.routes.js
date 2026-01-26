import { Router } from 'express';
import { requireAuth, requireAdmin, requireAestherOrVigilOrOverseer } from '../middleware/auth.js';
import { createAnnouncement, listAnnouncements, updateAnnouncement, deleteAnnouncement, getAnnouncementById, addComment, react, validateCreateAnnouncement, validateUpdateAnnouncement, validateDeleteAnnouncement, validateGetAnnouncement, validateAddComment, validateReact } from '../controllers/announcement.controller.js';
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

router.get('/', listAnnouncements);
router.get('/:id', validateGetAnnouncement, getAnnouncementById);
router.post('/:id/comments', requireAuth, validateAddComment, addComment);
router.post('/:id/react', requireAuth, validateReact, react);
router.post('/', requireAuth, requireAestherOrVigilOrOverseer, uploadImage.single('image'), handleMulterError, uploadToStorage, async (req, res, next) => {
  // Add imageUrl to req.body if file was uploaded (store only filename/path, not full URL)
  if (req.file) {
    // Use storagePath from Supabase (filename only), otherwise fall back to local path
    req.body.imageUrl = req.file.storagePath || `/uploads/${req.file.filename}`;
  }
  next();
}, validateCreateAnnouncement, createAnnouncement);
router.put('/:id', requireAuth, requireAestherOrVigilOrOverseer, uploadImage.single('image'), handleMulterError, uploadToStorage, async (req, res, next) => {
  // Add imageUrl to req.body if file was uploaded (store only filename/path, not full URL)
  if (req.file) {
    // Use storagePath from Supabase (filename only), otherwise fall back to local path
    req.body.imageUrl = req.file.storagePath || `/uploads/${req.file.filename}`;
  }
  next();
}, validateUpdateAnnouncement, updateAnnouncement);
router.delete('/:id', requireAuth, requireAestherOrVigilOrOverseer, validateDeleteAnnouncement, deleteAnnouncement);

export default router;

