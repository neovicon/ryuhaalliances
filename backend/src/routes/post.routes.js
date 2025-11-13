import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { addComment, createPost, listPosts, listPostsByUser, react, removePost, validateComment, validateCreatePost, validateDelete, validateReact } from '../controllers/post.controller.js';

const router = Router();
router.get('/user/:identifier', listPostsByUser);
router.get('/', requireAuth, listPosts);
router.post('/', requireAuth, validateCreatePost, createPost);
router.post('/:id/comments', requireAuth, validateComment, addComment);
router.post('/:id/react', requireAuth, validateReact, react);
router.delete('/:id', requireAuth, requireAdmin, validateDelete, removePost);
export default router;


