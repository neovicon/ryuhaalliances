import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { uploadImage, uploadToStorage } from '../middleware/upload.js';
import {
    listMembers,
    createMember,
    updateMember,
    deleteMember,
    validateCreateMember,
    validateUpdateMember,
    validateDeleteMember
} from '../controllers/leadership.controller.js';

const router = Router();

// Public route
router.get('/', listMembers);

// Admin routes
router.post(
    '/',
    requireAuth,
    requireAdmin,
    uploadImage.single('image'),
    uploadToStorage,
    validateCreateMember,
    createMember
);

router.put(
    '/:id',
    requireAuth,
    requireAdmin,
    uploadImage.single('image'),
    uploadToStorage,
    validateUpdateMember,
    updateMember
);

router.delete(
    '/:id',
    requireAuth,
    requireAdmin,
    validateDeleteMember,
    deleteMember
);

export default router;
