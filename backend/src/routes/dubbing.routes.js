import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
    getAllDubbingVideos,
    getDubbingVideo,
    createDubbingVideo,
    validateCreateDubbingVideo,
    addReaction,
    validateAddReaction,
    removeReaction,
    validateRemoveReaction,
    addComment,
    validateAddComment,
    deleteComment,
    validateDeleteComment,
    incrementShareCount,
    deleteDubbingVideo
} from '../controllers/dubbing.controller.js';

const router = Router();

// Public routes
router.get('/', getAllDubbingVideos);
router.get('/:id', getDubbingVideo);
router.post('/:id/share', incrementShareCount);

// Authenticated routes
router.post('/', requireAuth, validateCreateDubbingVideo, createDubbingVideo);
router.post('/:id/reactions', requireAuth, validateAddReaction, addReaction);
router.delete('/:id/reactions', requireAuth, validateRemoveReaction, removeReaction);
router.post('/:id/comments', requireAuth, validateAddComment, addComment);
router.delete('/:id/comments/:commentId', requireAuth, validateDeleteComment, deleteComment);
router.delete('/:id', requireAuth, deleteDubbingVideo);

export default router;
