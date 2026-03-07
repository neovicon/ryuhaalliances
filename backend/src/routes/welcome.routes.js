import express from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.js';
import { createWelcomePost, getWelcomePosts, getRecentWelcomePosts, deleteWelcomePost } from '../controllers/welcome.controller.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/', requireAuth, upload.single('image'), createWelcomePost);
router.get('/', getWelcomePosts);
router.get('/recent', getRecentWelcomePosts);
router.delete('/:id', requireAuth, requireAdmin, deleteWelcomePost);

export default router;
