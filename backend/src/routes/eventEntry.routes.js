import express from 'express';
import { createEntry, getEntries, addReaction, addComment, deleteEntry, updateEntry } from '../controllers/eventEntry.controller.js';
import { requireAuth, requireAdmin, requireModerator } from '../middleware/auth.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Public routes
router.get('/', getEntries);

// Reaction route with conditional auth
router.post('/:id/react', (req, res, next) => {
    if (req.body.isVisitor) {
        next();
    } else {
        requireAuth(req, res, next);
    }
}, addReaction);

// Protected routes
router.post('/:id/comment', requireAuth, addComment);

// Admin/Moderator routes
router.post('/', requireAuth, requireModerator, upload.single('media'), createEntry);
router.put('/:id', requireAuth, requireModerator, updateEntry);
router.delete('/:id', requireAuth, requireModerator, deleteEntry);

export default router;
