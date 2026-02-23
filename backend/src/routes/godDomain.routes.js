import express from 'express';
import * as godDomainController from '../controllers/godDomain.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { uploadMedia, uploadToStorage } from '../middleware/upload.js';

const router = express.Router();

router.get('/houses', requireAuth, godDomainController.listHouses);
router.get('/posts/:house', requireAuth, godDomainController.listPosts);

router.post('/posts',
    requireAuth,
    uploadMedia.fields([{ name: 'image', maxCount: 1 }]),
    uploadToStorage,
    godDomainController.validateCreatePost,
    godDomainController.createPost
);

router.post('/posts/:id/comments',
    requireAuth,
    godDomainController.validateComment,
    godDomainController.addComment
);

router.delete('/posts/:id', requireAuth, godDomainController.removePost);
router.patch('/posts/:id', requireAuth, uploadMedia.fields([{ name: 'image', maxCount: 1 }]), uploadToStorage, godDomainController.updatePost);
router.delete('/posts/:id/comments/:commentId', requireAuth, godDomainController.removeComment);
router.patch('/posts/:id/comments/:commentId', requireAuth, godDomainController.updateComment);

router.patch('/blessing-points', requireAuth, godDomainController.updateBlessingPoints);

export default router;
