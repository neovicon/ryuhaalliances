import express from 'express';
import { createEntry, getEntries, addReaction, addComment, deleteEntry, updateEntry } from '../controllers/eventEntry.controller.js';
import { requireAuth, requireAdmin, requireModerator, optionalAuth } from '../middleware/auth.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Public routes
router.get('/', optionalAuth, getEntries);

// Reaction route
router.post('/:id/react', optionalAuth, addReaction);

// Protected routes
router.post('/:id/comment', requireAuth, addComment);

// Admin/Moderator routes
router.post('/', requireAuth, requireModerator, upload.single('media'), createEntry);
router.put('/:id', requireAuth, requireModerator, updateEntry);
router.delete('/:id', requireAuth, requireModerator, deleteEntry);

export default router;
